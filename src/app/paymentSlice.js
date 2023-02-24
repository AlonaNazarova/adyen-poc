import { createSlice } from "@reduxjs/toolkit";

export const slice = createSlice({
  name: "payment",
  initialState: {
    error: "",
    session: null,
    paymentMethods: [],
    paymentData: null,
    orderRef: null,
    paymentDataStoreRes: null,
    config: {
      storePaymentMethod: true,
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
      locale: "en_US",
      showPayButton: true,
      clientKey: process.env.REACT_APP_ADYEN_CLIENT_KEY,
      environment: "test",
    },
  },
  reducers: {
    paymentSession: (state, action) => {
      const [res, status] = action.payload;
      if (status >= 300) {
        state.error = res;
      } else {
        [state.session, state.orderRef] = res;
      }
    },
    paymentMethods: (state, action) => {
      console.log('paymentMethods res', state.paymentMethods, action)
      const [res, status] = action.payload;
      if (status >= 300) {
        state.error = res;
      } else {
        state.paymentMethods = res.paymentMethods;
      }
    },
    paymentData: (state, action) => {
      console.log('paymentData res', state.paymentMethods, action)
      const [res, status] = action.payload;
      if (status >= 300) {
        state.error = res;
      } else {
        state.paymentData = res;
      }
    },
    clearPaymentSession: (state) => {
      state.error = "";
      state.session = null;
      state.orderRef = null;
    },
    paymentDataStore: (state, action) => {
      const [res, status] = action.payload;
      if (status >= 300) {
        state.error = res;
      } else {
        state.paymentDataStoreRes = res;
      }
    },
  },
});

export const { paymentSession, clearPaymentSession, paymentDataStore, paymentMethods, paymentData } = slice.actions;

export const initiateCheckout = (type) => async (dispatch) => {
  const response = await fetch(`/api/sessions?type=${type}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  dispatch(paymentSession([await response.json(), response.status]));
};

export const getPaymentMethods = (type) => async (dispatch) => {
  const response = await fetch(`/api/paymentMethods`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  console.log('response', response)
  dispatch(paymentMethods([await response.json(), response.status]));
};

export const postPaymentData = (paymentInfo) => async (dispatch) => {
  const response = await fetch(`/api/paymentData`, {
    method: "POST",
    body: paymentInfo,
    headers: {
      "Content-Type": "application/json",
    },
  });
  console.log('response', response)
  dispatch(paymentData([await response.json(), response.status]));
};

export const getPaymentDataStore = () => async (dispatch) => {
  const response = await fetch("/api/getPaymentDataStore");
  dispatch(paymentDataStore([await response.json(), response.status]));
};

export const cancelOrRefundPayment = (orderRef) => async (dispatch) => {
  await fetch(`/api/cancelOrRefundPayment?orderRef=${orderRef}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  dispatch(getPaymentDataStore());
};

export default slice.reducer;
