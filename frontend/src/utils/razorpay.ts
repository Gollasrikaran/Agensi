export const loadRazorpay = (options: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    // If it's already loaded, just return the instance
    if ((window as any).Razorpay) {
      resolve(new (window as any).Razorpay(options));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    
    script.onload = () => {
      if (!(window as any).Razorpay) {
        reject(new Error('Razorpay SDK failed to load.'));
        return;
      }
      resolve(new (window as any).Razorpay(options));
    };

    script.onerror = () => {
      reject(new Error('Razorpay SDK failed to load. Check your internet connection.'));
    };

    document.body.appendChild(script);
  });
};