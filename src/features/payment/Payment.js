import React, {useEffect, useRef, useState} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import AdyenCheckout from "@adyen/adyen-web";
import "@adyen/adyen-web/dist/adyen.css";
import { getPaymentMethods, postPaymentData } from "../../app/paymentSlice";
import { getRedirectUrl } from "../../util/redirect";

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // paymentMethods are retrieved from /paymentMethods in PaymentMethods component
  const paymentMethods = useSelector(state => state.payment.paymentMethods);
  // container for mounting Adyen pre-build payment method component into it
  const paymentContainer = useRef(null);
  // store currently mounted payment method component, so we could call checkoutComponent.submit() when we need to
  const [checkoutComponent, setCheckoutComponent] = useState(null);

  const config = {
    storePaymentMethod: true,
    // just some example configs
    paymentMethodsConfiguration: {
      ideal: {
        showImage: true,
      },
      card: {
        hasHolderName: true,
        holderNameRequired: true,
        name: "Credit or debit card",
        amount: {
          value: 10000, // 100€ in minor units
          currency: "EUR",
        },
      },
    },
    // full response from /paymentMethods, as stated in documentation
    // https://docs.adyen.com/online-payments/web-components/additional-use-cases/advanced-flow?tab=codeBlockpayments_request_component_FICDk_JS_7#step-2-add-components
    paymentMethodsResponse: paymentMethods,
    locale: "en_US",
    clientKey: process.env.REACT_APP_ADYEN_CLIENT_KEY,
    environment: "test",
  };

  const [selectedTab, setSelectedTab] = useState('Payment');

  const [selectedMethod, setSelectedMethod] = useState(null);
  const selectMethod = (type, options) => async () => {
    setSelectedMethod(type);
    const checkout = await AdyenCheckout({
      ...config,
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
        // can be used to disable "next" button, to prevent tab switch if provided payment data is incomplete
        console.log('state.isValid', state.isValid)
        console.log('state.data', state.data)
        // post to server
        dispatch(postPaymentData(JSON.stringify(state.data.paymentMethod)));
      }
    });
    // create Adyen pre-build payment method component
    console.log('create Adyen pre-build payment method component', type, options, paymentContainer.current)
    const component = checkout.create(type, options).mount(paymentContainer.current);
    setCheckoutComponent(component);
  };

  const isPaymentTabSelected = selectedTab === 'Payment';

  // show tabs layout:
  // First tab - Selectable payment methods list
  // Second tab - Our custom PAY button
  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-evenly',
        width: 600,
        marginBottom: '2rem',
      }}>
        <h3 style={{ color: isPaymentTabSelected ? 'red' : 'black' }}>Payment</h3>
        <h3 style={{ color: !isPaymentTabSelected ? 'red' : 'black' }}>Order review</h3>
      </div>
      <div style={{ display: isPaymentTabSelected ? 'block' : 'none' }}>
        <PaymentMethods selectedMethod={selectedMethod} selectMethod={selectMethod} checkoutComponent={checkoutComponent} ref={paymentContainer}>
          <div ref={paymentContainer} className="payment"></div>
        </PaymentMethods>
        <br/>
        <br/>
        <button onClick={() => setSelectedTab('Order review')}>next step</button>
      </div>
      <div style={{ display: selectedTab === 'Order review' ? 'block' : 'none' }}>
        <PayButton selectedMethod={selectedMethod} checkoutComponent={checkoutComponent}/>
        <br/>
        <br/>
        <button onClick={() => setSelectedTab('Payment')}>prev step</button>
      </div>
    </div>
  )
}

const PaymentMethods = ({ selectMethod, selectedMethod, children }) => {
  const dispatch = useDispatch();
  const paymentMethods = useSelector(state => state.payment.paymentMethods);

  useEffect(() => {
    // get the list of available payment methods and put the in store
    // https://docs.adyen.com/online-payments/web-components/additional-use-cases/advanced-flow?tab=codeBlockpayments_request_component_FICDk_JS_7#step-1-get-available-payment-methods
    dispatch(getPaymentMethods());
  }, []);

  return (
    <div>
      Select method:
      {paymentMethods?.paymentMethods?.map(method => {
        const { name, type, ...rest } = method
        return (
          <div>
            <label>
              <input type="checkbox" onChange={selectMethod(method.type, rest)} checked={selectedMethod === method.type}/>
              {method.name}
            </label>
            {selectedMethod === method.type && children}
          </div>
        )
      })}
    </div>
  )
}

const PayButton = ({ checkoutComponent }) => {
  const paymentData = useSelector(state => state.payment.paymentData);
  const navigate = useNavigate();
  const paymentDataResponse = paymentData?.[0];

  useEffect(() => {
    // handle the result of payment
    if (paymentDataResponse?.action) {
      // handle redirects and etc
      checkoutComponent.handleAction(paymentDataResponse.action)
    } else if (paymentDataResponse?.resultCode) {
      // if result present, show it to user
      navigate(getRedirectUrl(paymentDataResponse.resultCode));
    }
  }, [paymentDataResponse])

  const handlePay = () => {
    // triggering submit on Adyen pre-build payment method component
    checkoutComponent.submit();
  };

  return (
    <button onClick={handlePay} style={{ width: '100%' }}>PAY</button>
  )
}

export const PaymentContainer = Checkout;
