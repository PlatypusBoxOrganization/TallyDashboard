import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { formatPrice } from '../utils/formatters';

export const searchAll = async (searchTerm) => {
  if (!searchTerm) return [];

  const searchTermLower = searchTerm.toLowerCase();
  const results = [];

  try {
    // Search users
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      type: 'user',
      ...doc.data()
    })).filter(user => 
      user.fullName?.toLowerCase().includes(searchTermLower) ||
      user.username?.toLowerCase().includes(searchTermLower) ||
      user.email?.toLowerCase().includes(searchTermLower)
    ).map(user => ({
      id: user.id,
      type: 'user',
      title: user.fullName,
      subtitle: user.email,
      link: '/users'
    }));

    // Search subscription plans
    const plansQuery = query(collection(db, 'subscriptions'));
    const plansSnapshot = await getDocs(plansQuery);
    const plans = plansSnapshot.docs.map(doc => ({
      id: doc.id,
      type: 'plan',
      ...doc.data()
    })).filter(plan => {
      const priceString = formatPrice(plan.price);
      return (
        plan.planName?.toLowerCase().includes(searchTermLower) ||
        priceString.toLowerCase().includes(searchTermLower) ||
        plan.features?.some(feature => 
          feature.toLowerCase().includes(searchTermLower)
        )
      );
    }).map(plan => ({
      id: plan.id,
      type: 'plan',
      title: plan.planName,
      subtitle: `${formatPrice(plan.price)} / month`,
      link: '/subscriptions'
    }));

    // Combine and sort results
    results.push(...users, ...plans);
    
    // Sort results by relevance (exact matches first)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === searchTermLower;
      const bExact = b.title.toLowerCase() === searchTermLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

    return results;
  } catch (error) {
    console.error('Error searching:', error);
    return [];
  }
};
