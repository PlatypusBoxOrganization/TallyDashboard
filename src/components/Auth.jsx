import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (!userData.isActive) {
            // Redirect to WhatsApp for approval
            const message = `New user registration: ${userData.name} (${user.email})`;
            const whatsappUrl = `https://wa.me/${process.env.REACT_APP_WHATSAPP_NUMBER || '918149005122'}?text=${encodeURIComponent(message)}`;
            window.location.href = whatsappUrl;
            await auth.signOut();
            setError("Your account is pending approval. Please contact admin.");
          } else {
            localStorage.setItem("userToken", user.accessToken);
            localStorage.setItem("userRole", userData.role);
            navigate(userData.role === "admin" ? "/dashboard" : "/users");
          }
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // Login Logic
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Check user status in Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists() || !userDoc.data().isActive) {
          await auth.signOut();
          setError("Your account is not active. Please contact admin.");
          return;
        }
        
        localStorage.setItem("userToken", user.accessToken);
        localStorage.setItem("userRole", userDoc.data().role);
        navigate(userDoc.data().role === "admin" ? "/dashboard" : "/users");
      } else {
        // Signup Logic
        if (!name.trim()) {
          setError("Please enter your name");
          return;
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create user document in Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name,
          email,
          role: "user", // Default role
          isActive: false, // New users are inactive by default
          createdAt: new Date().toISOString(),
        });
        
        // Notify admin via WhatsApp
        const message = `New user registration: ${name} (${email}). Please activate their account.`;
        const whatsappUrl = `https://wa.me/${process.env.REACT_APP_WHATSAPP_NUMBER || '918149005122'}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        
        alert("Account created successfully! Please wait for admin approval.");
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 rounded-3xl">
      <div className="w-full max-w-sm bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
          {isLogin ? "Login" : "Create Account"}
        </h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleAuth}>
          {!isLogin && (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required={!isLogin}
              />
            </div>
          )}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processing...' : isLogin ? 'Login' : 'Create Account'}
            </button>
          </div>
        </form>
        <p className="text-center mt-4 text-sm">
          {isLogin ? (
            <>
              Don't have an account?{" "}
              <span
                onClick={() => setIsLogin(false)}
                className="text-blue-500 hover:underline cursor-pointer"
              >
                Create an account
              </span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span
                onClick={() => setIsLogin(true)}
                className="text-blue-500 hover:underline cursor-pointer"
              >
                Login
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default Auth;
