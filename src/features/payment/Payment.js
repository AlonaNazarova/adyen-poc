import React, {useEffect, useRef, useState} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import AdyenCheckout from "@adyen/adyen-web";
import "@adyen/adyen-web/dist/adyen.css";
import {getPaymentMethods, initiateCheckout, postPaymentData} from "../../app/paymentSlice";
import { getRedirectUrl } from "../../util/redirect";

export const PaymentContainer = () => {
  const { type } = useParams();

  return (
    <div id="payment-page">
      <div className="container">
        <Checkout type={type} />
      </div>
    </div>
  );
}

const PaymentMethods = ({ selectMethod, selectedMethod, children }) => {
  const dispatch = useDispatch();
  const paymentMethods = useSelector(state => state.payment.paymentMethods);

  useEffect(() => {
    dispatch(getPaymentMethods());
  }, []);

  // const component = checkout.create(type).mount(paymentContainer.current);

  return (
    <div>
      Select method:
      {paymentMethods?.map(method => (
        <div>
          <label>
            <input type="checkbox" onChange={selectMethod(method.type)} checked={selectedMethod === method.type}/>
            {method.name}
          </label>
          {selectedMethod === method.type && children}
          {/*{selectedMethod === method.type && checkoutComponent}*/}
        </div>
      ))}
    </div>
  )
}

const PayButton = ({ selectedMethod, checkoutComponent }) => {
  const paymentData = useSelector(state => state.payment.paymentData);
  const navigate = useNavigate();
  const paymentDataResponse = paymentData?.[0];



  useEffect(() => {
    console.log('paymentDataResponse',paymentDataResponse)
    if (paymentDataResponse?.action) {
      checkoutComponent.handleAction(paymentDataResponse.action)
    } else if (paymentDataResponse?.resultCode) {
      navigate(getRedirectUrl(paymentDataResponse.resultCode));
    }
  }, [paymentDataResponse])
  const handlePay = () => {
    // If you want to use your own button and then trigger the submit flow on your own,
    // set this to false and call the .submit() method from your own button implementation.
    // For example, component.submit().
    checkoutComponent.submit();
  };
  return (
    <button onClick={handlePay}>PAY</button>
  )
}

const Checkout = () => {
  const dispatch = useDispatch();
  const payment = useSelector(state => state.payment);
  const paymentMethods = payment.paymentMethods;

  const navigate = useNavigate();

  const paymentContainer = useRef(null);
  const [checkoutComponent, setCheckoutComponent] = useState(null);
  const { type } = useParams();
  //
  // useEffect(() => {
  //   dispatch(getPaymentMethods(type));
  //   // dispatch(initiateCheckout(type));
  // }, [dispatch, type]);


  useEffect(() => {
    const { error } = payment;

    if (error) {
      navigate(`/status/error?reason=${error}`, { replace: true });
    }
  }, [payment, navigate])


  // useEffect(() => {
    const { config, session } = payment;
  //
  //
  //   console.log('config', config)
  //
  //   if (!session || !paymentContainer.current) {
  //     // initiateCheckout is not finished yet.
  //     return;
  //   }
  //
  //   const createCheckout = async () => {
  //     const checkout = await AdyenCheckout({
  //       ...config,
  //       session,
  //       onPaymentCompleted: (response, _component) =>
  //       {
  //         console.log('onPaymentCompleted', response, _component);
  //         navigate(getRedirectUrl(response.resultCode), { replace: true })
  //       },
  //       onError: (error, _component) => {
  //         console.error('AdyenCheckout onError: ', error, _component);
  //         navigate(`/status/error?reason=${error.message}`, { replace: true });
  //       },
  //     });
  //
  //     console.log('checkout.paymentMethodsResponse', checkout.paymentMethodsResponse)
  //
  //     if (paymentContainer.current) {
  //       const component = checkout.create(type).mount(paymentContainer.current);
  //       setCheckoutComponent(component);
  //     }
  //
  //   }
  //
  //   createCheckout();
  // }, [payment, type, navigate]);
  //
  // const handlePay = () => {
  //   // If you want to use your own button and then trigger the submit flow on your own,
  //   // set this to false and call the .submit() method from your own button implementation.
  //   // For example, component.submit().
  //   checkoutComponent.submit();
  // };

  // debit or credit
  // bank transfer
  // apple pay
  // google pay
  // paypal

  // bankTransfer_IBAN
  // applepay: typeof ApplePay;
  // googlepay: typeof GooglePay;
  // paypal: typeof PayPal;

  const [selectedTab, setSelectedTab] = useState('Payment');

  const [selectedMethod, setSelectedMethod] = useState(null);
  const selectMethod = (type) => async () => {
    setSelectedMethod(type);
    const checkout = await AdyenCheckout({
      ...config,
      // session,
      onPaymentCompleted: (response, _component) =>
      {
        console.log('onPaymentCompleted', response, _component);
        navigate(getRedirectUrl(response.resultCode), { replace: true })
      },
      onError: (error, _component) => {
        console.error('AdyenCheckout onError: ', error, _component);
        navigate(`/status/error?reason=${error.message}`, { replace: true });
      },
      onSubmit: (state, component) => {
        console.log('state.isValid', state.isValid)
        console.log('state.data', state.data)
        // post to server
        dispatch(postPaymentData(JSON.stringify(state.data.paymentMethod)));
      }
    });
    const component = checkout.create(type).mount(paymentContainer.current);
    setCheckoutComponent(component);

    // setCheckoutComponent(checkout);
  };

  // console.log('component.isValid()', checkoutComponent?.isValid)
  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-evenly',
      }}>
        <h3 onClick={() => setSelectedTab('Payment')}>Payment</h3>
        <h3 onClick={() => setSelectedTab('Order review')}>Order review</h3>
      </div>
      <div style={{ display: selectedTab === 'Payment' ? 'block' : 'none' }}>
        <PaymentMethods selectedMethod={selectedMethod} selectMethod={selectMethod} checkoutComponent={checkoutComponent} ref={paymentContainer}><div ref={paymentContainer} className="payment"></div></PaymentMethods>}
      </div>
      <div style={{ display: selectedTab === 'Order review' ? 'block' : 'none' }}>
        <PayButton selectedMethod={selectedMethod} checkoutComponent={checkoutComponent}/>
      </div>
    </div>
  )

//   return (
//     <>
//       <div className="payment-container">
//         <div ref={paymentContainer} className="payment"></div>
//       </div>
//       <button onClick={handlePay}>CUSTOM PAYMENT BUTTON</button>
//     </>
// );
}
