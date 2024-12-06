export const formatPrice = (price) => {
  if (!price && price !== 0) return '';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);
};

export const parsePrice = (priceString) => {
  if (!priceString) return '';
  const number = Number(priceString);
  return isNaN(number) ? '' : number;
};

export const formatFeatures = (featuresString) => {
  if (!featuresString) return [];
  return featuresString
    .split(',')
    .map(feature => feature.trim())
    .filter(Boolean);
};
