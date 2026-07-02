import React, { useState } from "react";
import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

function Auth() {
    const [isLogin, setIsLogin] = useState(true);

    const [formData, setFormData] = useState({
        username: "",
        password: "",
        email: ""
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [usernameAvailable, setUsernameAvailable] = useState(null);

    // 🔐 HASH FUNCTION (same as your Users page)
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
    }

    // ⚡ USERNAME CHECK (REAL-TIME)
    const checkUsername = async (username) => {
        if (!username) return;

        const usernameCaps = username.trim().toUpperCase();
        const ref = doc(db, "users", usernameCaps);
        const snap = await getDoc(ref);

        setUsernameAvailable(!snap.exists());
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (!isLogin && name === "username") {
            checkUsername(value);
        }
    };

    // 🚀 LOGIN + SIGNUP
    const handleAuth = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            const usernameCaps = formData.username.trim().toUpperCase();
            const userRef = doc(db, "users", usernameCaps);
            const userSnap = await getDoc(userRef);

            if (isLogin) {
                // 🔐 LOGIN
                if (!userSnap.exists()) {
                    throw new Error("User not found");
                }

                const userData = userSnap.data();
                const enteredHash = await hashPassword(formData.password);

                if (enteredHash !== userData.passwordHash) {
                    throw new Error("Invalid password");
                }

                if (userData.status !== "active") {
                    throw new Error("User is inactive");
                }

                // ✅ Save session
                localStorage.setItem("user", JSON.stringify({
                    username: userData.username,
                    fullName: userData.fullName,
                    role: userData.role || 'parent',
                    parentId: userData.parentId || null,
                    permissions: userData.permissions || {}
                }));

                window.location.href = "/dashboard";

            } else {
                // 🆕 SIGNUP

                if (userSnap.exists()) {
                    throw new Error("Username already taken");
                }

                const passwordHash = await hashPassword(formData.password);

                // Create parent user with default settings
                await setDoc(userRef, {
                    username: usernameCaps,
                    email: formData.email, // ✅ can repeat
                    passwordHash,
                    createdAt: new Date().toISOString(),
                    status: "active",
                    // NEW ROLE FIELDS
                    role: "parent", // Direct signup creates parent
                    parentId: null, // Parents have no parent
                    childLimit: 5,  // Default child limit
                    childCount: 0,  // No children initially
                    permissions: {  // Full permissions for parents
                        viewDashboard: true,
                        viewSubscriptions: true,
                        viewUsers: true,
                        manageSubscriptions: true,
                        manageUsers: false,
                        viewReports: true,
                        createChildren: true,
                        manageChildren: true
                    },
                    createdBy: "SELF"
                });

                setSuccess("Account created! Please login.");
                setIsLogin(true);
            }

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100 rounded-3xl">
            <div className="w-full max-w-sm bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">

                <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
                    {isLogin ? "Login" : "Sign Up"}
                </h2>

                {error && <p className="text-red-500 text-center mb-2">{error}</p>}
                {success && <p className="text-green-500 text-center mb-2">{success}</p>}

                <form onSubmit={handleAuth}>

                    {/* USERNAME */}
                    <div className="mb-4">
                        <label className="block text-sm font-bold mb-2">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Enter username"
                            className="border rounded w-full py-2 px-3"
                            required
                        />

                        {/* ⚡ LIVE VALIDATION */}
                        {!isLogin && formData.username && (
                            <div className="text-sm mt-1">
                                {usernameAvailable === null ? null : usernameAvailable ? (
                                    <span className="text-green-600">Username available ✅</span>
                                ) : (
                                    <span className="text-red-600">Username taken ❌</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* EMAIL (ONLY FOR SIGNUP) */}
                    {!isLogin && (
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-2">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter email"
                                className="border rounded w-full py-2 px-3"
                                required
                            />
                        </div>
                    )}

                    {/* PASSWORD */}
                    <div className="mb-4">
                        <label className="block text-sm font-bold mb-2">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter password"
                            className="border rounded w-full py-2 px-3"
                            required
                        />
                    </div>

                    <button className="bg-blue-500 hover:bg-blue-700 text-white w-full py-2 rounded">
                        {isLogin ? "Login" : "Sign Up"}
                    </button>
                </form>

                <p className="text-center mt-4 text-sm">
                    {isLogin ? (
                        <>
                            Don't have an account?{" "}
                            <span
                                onClick={() => setIsLogin(false)}
                                className="text-blue-500 cursor-pointer"
                            >
                                Sign Up
                            </span>
                        </>
                    ) : (
                        <>
                            Already have an account?{" "}
                            <span
                                onClick={() => setIsLogin(true)}
                                className="text-blue-500 cursor-pointer"
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