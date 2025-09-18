import React from 'react';
import OrderLayout from '../components/OrderLayout';
import OrderPage from './OrderPage';

const MainOrderPage: React.FC = () => {
  return (
    <OrderLayout>
      <OrderPage />
    </OrderLayout>
  );
};

export default MainOrderPage;
