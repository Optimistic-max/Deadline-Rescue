import { useState, useEffect } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';

export function usePremiumStatus() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPremiumStatus();

    const listener = (customerInfo: CustomerInfo) => {
      setIsPremium(
        typeof customerInfo.entitlements.active['deadline_rescue_premium'] !== 'undefined'
      );
    };

    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  const checkPremiumStatus = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      setIsPremium(
        typeof customerInfo.entitlements.active['deadline_rescue_premium'] !== 'undefined'
      );
    } catch (error) {
      console.error('Error checking premium status:', error);
    } finally {
      setLoading(false);
    }
  };

  return { isPremium, loading };
}