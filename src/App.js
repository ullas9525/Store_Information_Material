// Import necessary hooks and functions from React.
import React, { useState, useEffect, useRef } from 'react';
// Import Firebase core and specific services.
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, addDoc, onSnapshot, serverTimestamp, updateDoc, deleteDoc, query, where, getDocs, setDoc, runTransaction } from 'firebase/firestore';

// --- IMPORTANT ---
// This is your Firebase project's configuration object.
// It contains the keys and identifiers for your app to connect to Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyC-6LQ_kbUb65XlHGSpAAbYJi9Z3IpL-gc",
  authDomain: "store-material-informations.firebaseapp.com",
  projectId: "store-material-informations",
  storageBucket: "store-material-informations.appspot.com",
  messagingSenderId: "63839882237",
  appId: "1:63839882237:web:22f9885194b56067466794"
};


// Initialize the Firebase app with the provided configuration. This is the entry point for using Firebase services.
const app = initializeApp(firebaseConfig);
// Get the authentication service instance.
const auth = getAuth(app);
// Get the Firestore database service instance.
const db = getFirestore(app);

// --- Main App Component ---
// This is the root component of the application.
export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadScript = (src, id, callback) => {
        if (!document.getElementById(id)) {
            const script = document.createElement('script');
            script.src = src;
            script.id = id;
            script.onload = () => {
                if (callback) callback();
            };
            document.head.appendChild(script);
        } else if (callback) {
            callback();
        }
    };

    loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'jspdf-script', () => {
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js', 'jspdf-autotable-script');
    });
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'xlsx-script');
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout Error:", error);
        setError("Failed to log out.");
    } finally {
        setUser(null);
        setUserRole(null);
        setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
            setUser(currentUser);
        } else {
            setError("Your user role is not configured. Please contact an administrator.");
            handleLogout();
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (email, password) => {
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError('Failed to login. Please check your email and password.');
      console.error("Login Error:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl font-semibold">Loading...</div></div>;
  }

  const renderDashboard = () => {
    switch (userRole) {
      case 'master':
        return <MasterDashboard user={user} onLogout={handleLogout} />;
      case 'caseworker':
        return <CaseworkerDashboard user={user} onLogout={handleLogout} />;
      case 'approver':
        return <ApproverDashboard user={user} onLogout={handleLogout} />;
      case 'consumer':
        return <ConsumerDashboard user={user} onLogout={handleLogout} />;
      default:
        if (user) {
            return (
                <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                    <h2 className="text-2xl font-bold mb-4">Authorization Pending</h2>
                    <p className="mb-4 text-center">{error || "Your account role is being set up. This should be quick."}</p>
                    <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Logout</button>
                </div>
            );
        }
        return <Login onLogin={handleLogin} error={error} />;
    }
  };

  return <div className="h-screen bg-gray-50">{renderDashboard()}</div>;
}

// --- Password Visibility Toggle Icon ---
const EyeIcon = ({ visible, onClick }) => (
    <button type="button" onClick={onClick} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
        {visible ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0110 19c-4.478 0-8.268-2.943-9.542-7 .946-3.118 3.544-5.473 6.836-6.234M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.066 6.934A10.009 10.009 0 0110 3c4.478 0 8.268 2.943 9.542 7a9.982 9.982 0 01-1.42 2.994M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 2l20 20" />
            </svg>
        )}
    </button>
);


// --- Login Component [UPDATED] ---
function Login({ onLogin, error }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(email, password);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-3xl font-bold text-center text-gray-900">Sign In</h2>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</label>
                        <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="you@example.com" />
                    </div>
                    <div className="relative"> {/* Added relative positioning here */}
                        <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                        <input id="password" name="password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 pr-12" placeholder="••••••••" />
                        <EyeIcon visible={showPassword} onClick={() => setShowPassword(!showPassword)} />
                    </div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <div>
                        <button type="submit" className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                           Sign In
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- Change Password Modal ---
function ChangePasswordModal({ user, onClose }) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }

        if (!user) {
            setError("No user is signed in.");
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(user.email, oldPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            setSuccess("Password updated successfully!");
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            console.error("Password Change Error:", error);
            setError("Failed to change password. Check your old password.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">Change Password</h2>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <input
                        type="password"
                        placeholder="Old Password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        required
                    />
                    <input
                        type="password"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        required
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    {success && <p className="text-green-500 text-sm">{success}</p>}
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Update</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- Logout Confirmation Modal ---
function LogoutConfirmationModal({ onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
                <h2 className="text-xl font-bold mb-4 text-center">Confirm Logout</h2>
                <p className="text-center text-gray-600 mb-6">Are you sure you want to log out?</p>
                <div className="flex justify-center gap-4">
                    <button onClick={onCancel} className="px-6 py-2 bg-gray-300 rounded-md hover:bg-gray-400">No</button>
                    <button onClick={onConfirm} className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Yes, Logout</button>
                </div>
            </div>
        </div>
    );
}

// --- Settings Button and Dropdown ---
function SettingsButton({ user, onLogout }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown if clicked outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsDropdownOpen(prev => !prev)} className="p-2 rounded-full hover:bg-gray-200" title="Settings">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>

            {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 py-1">
                    <button
                        onClick={() => {
                            setIsPasswordModalOpen(true);
                            setIsDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                        Change Password
                    </button>
                    <button
                        onClick={() => {
                            setIsLogoutModalOpen(true);
                            setIsDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                        Logout
                    </button>
                </div>
            )}

            {isPasswordModalOpen && <ChangePasswordModal user={user} onClose={() => setIsPasswordModalOpen(false)} />}
            {isLogoutModalOpen && <LogoutConfirmationModal onConfirm={onLogout} onCancel={() => setIsLogoutModalOpen(false)} />}
        </div>
    );
}

// --- Add Designation Modal [NEW] ---
function AddDesignationModal({ onClose, onAddDesignation }) {
    const [newDesignationName, setNewDesignationName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!newDesignationName.trim()) {
            setError("Please enter a designation name.");
            return;
        }
        await onAddDesignation(newDesignationName.trim());
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <h2 className="text-2xl font-bold mb-6 text-center">Add New Designation</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="designationName" className="block text-sm font-medium text-gray-700 mb-1">Designation Name</label>
                        <input
                            type="text"
                            id="designationName"
                            value={newDesignationName}
                            onChange={(e) => setNewDesignationName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Add Designation</button>
                    </div>
                </form>
            </div>
        </div>
    );
}


// --- Master Dashboard Component [UPDATED] ---
function MasterDashboard({ user, onLogout }) {
    const [users, setUsers] = useState([]);
    // State for new user form
    const [uniqueId, setUniqueId] = useState('');
    const [name, setName] = useState('');
    const [designation, setDesignation] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserRole, setNewUserRole] = useState('consumer'); // Default to consumer
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // State for password visibility
    const [showSetPassword, setShowSetPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // State for designations
    const [designations, setDesignations] = useState([]);
    const [isAddDesignationModalOpen, setIsAddDesignationModalOpen] = useState(false); // NEW state for modal

    // State for user editing mode
    const [editingUserId, setEditingUserId] = useState(null);
    
    // State for materials
    const [materials, setMaterials] = useState([]);
    const [newMaterialName, setNewMaterialName] = useState('');
    const [newMaterialType, setNewMaterialType] = useState('Non-returnable');
    const [newMaterialInfo, setNewMaterialInfo] = useState('Non-Electronic');
    const [editingMaterialId, setEditingMaterialId] = useState(null); // State for material editing
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useEffect(() => {
        // Subscribe to user changes
        const usersUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
            const usersList = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(u => u.role !== 'master');
            setUsers(usersList);
        });
        
        // Subscribe to material changes
        const materialsUnsubscribe = onSnapshot(collection(db, 'materials'), (snapshot) => {
            const materialsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMaterials(materialsList);
        });

        // Subscribe to designation changes
        const designationsUnsubscribe = onSnapshot(collection(db, 'designations'), (snapshot) => {
            const designationsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Add default designations if they don't exist in the fetched list
            const defaultDesignations = ["First Division Assistant", "Second Division Assistant", "Shiristhedar (RHA)"];
            const allDesignations = [...defaultDesignations, ...designationsList.map(d => d.name)];
            const uniqueDesignations = [...new Set(allDesignations)]; // Ensure uniqueness
            setDesignations(uniqueDesignations.map(name => ({name})));
        });

        // Cleanup subscriptions on component unmount
        return () => {
            usersUnsubscribe();
            materialsUnsubscribe();
            designationsUnsubscribe();
        };
    }, []);

    const handleAddDesignation = async (designationName) => { // Modified to accept designationName
        if (!designationName) {
            alert("Please enter a designation name.");
            return;
        }
        try {
            await addDoc(collection(db, 'designations'), { name: designationName });
            alert("Designation added successfully.");
        } catch (error) {
            console.error("Error adding designation: ", error);
            alert("Failed to add designation.");
        }
    };

    const resetUserForm = () => {
        setUniqueId('');
        setName('');
        setDesignation('');
        setNewUserEmail('');
        setPassword('');
        setConfirmPassword('');
        setNewUserRole('consumer'); // Default to consumer
        setEditingUserId(null);
    };

    const handleUserFormSubmit = async (e) => {
        e.preventDefault();

        if (editingUserId) {
            const updatedDetails = { uniqueId, name, designation, role: newUserRole };
            try {
                const userDocRef = doc(db, 'users', editingUserId);
                await updateDoc(userDocRef, updatedDetails);
                alert("User details updated successfully.");
                resetUserForm();
            } catch (error) {
                console.error("Error updating user details:", error);
                alert("Failed to update user details.");
            }
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        const tempAppName = `temp-app-${Date.now()}`;
        const tempApp = initializeApp(firebaseConfig, tempAppName);
        const tempAuth = getAuth(tempApp);

        try {
            const userCredential = await createUserWithEmailAndPassword(tempAuth, newUserEmail, password);
            const newUser = userCredential.user;

            await setDoc(doc(db, "users", newUser.uid), {
                uniqueId, name, designation, email: newUserEmail, role: newUserRole
            });

            alert(`User ${newUserEmail} created successfully.`);
            resetUserForm();

        } catch (error) {
            console.error("Error creating new user:", error);
            alert(`Failed to create user: ${error.message}`);
        } finally {
            await deleteApp(tempApp);
        }
    };

    const handleDeleteUser = async (userId) => {
        // Replaced window.confirm with a custom modal for consistency if needed,
        // but keeping it for now as per previous implementation.
        if (window.confirm("Are you sure you want to delete this user? This will remove their access permanently.")) {
            try {
                await deleteDoc(doc(db, 'users', userId));
                alert("User role and access have been removed.");
            } catch (error) {
                console.error("Error deleting user role: ", error);
                alert("Failed to delete user role.");
            }
        }
    };
    
    const handleEditUserClick = (userToEdit) => {
        setEditingUserId(userToEdit.id);
        setUniqueId(userToEdit.uniqueId || '');
        setName(userToEdit.name || '');
        setDesignation(userToEdit.designation || '');
        setNewUserEmail(userToEdit.email || '');
        setNewUserRole(userToEdit.role || 'consumer');
    };
    
    const resetMaterialForm = () => {
        setNewMaterialName('');
        setNewMaterialType('Non-returnable');
        setNewMaterialInfo('Non-Electronic');
        setEditingMaterialId(null);
    };

    const handleMaterialFormSubmit = async (e) => {
        e.preventDefault();
        if (!newMaterialName) { alert("Please enter a material name."); return; }

        const materialData = { name: newMaterialName, type: newMaterialType, info: newMaterialInfo };

        if (editingMaterialId) {
            try {
                const materialDocRef = doc(db, 'materials', editingMaterialId);
                await updateDoc(materialDocRef, materialData);
                alert("Material updated successfully.");
                resetMaterialForm();
            } catch (error) {
                console.error("Error updating material: ", error);
                alert("Failed to update material.");
            }
        } else {
            try {
                await addDoc(collection(db, 'materials'), materialData);
                resetMaterialForm();
            } catch (error) {
                console.error("Error adding new material: ", error);
                alert("Failed to add material.");
            }
        }
    };
    
    const handleEditMaterialClick = (materialToEdit) => {
        setEditingMaterialId(materialToEdit.id);
        setNewMaterialName(materialToEdit.name);
        setNewMaterialType(materialToEdit.type);
        setNewMaterialInfo(materialToEdit.info);
    };

    const handleDeleteMaterial = async (materialId) => {
        try {
            await deleteDoc(doc(db, 'materials', materialId));
            setConfirmDeleteId(null);
        } catch (error) {
            console.error("Error deleting material: ", error);
            alert("Failed to delete material.");
        }
    };

    const returnableMaterials = materials.filter(m => m.type === 'Returnable');
    const nonReturnableMaterials = materials.filter(m => m.type !== 'Returnable');

    return (
        <div className="flex flex-col h-screen p-4 md:p-8">
            <header className="flex-shrink-0 flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Master Portal</h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-600">{user.email}</span>
                    <SettingsButton user={user} onLogout={onLogout} />
                </div>
            </header>
            <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden">
                <div className="bg-white p-6 rounded-lg shadow-md flex flex-col">
                    <h2 className="text-2xl font-semibold mb-4">{editingUserId ? 'Edit User' : 'Create & Manage Users'}</h2>
                    <form onSubmit={handleUserFormSubmit} className="space-y-4">
                        <div className="flex items-center">
                            <label className="w-28 text-sm font-medium text-gray-600 shrink-0">Unique ID</label>
                            <span className="mx-2">:</span>
                            <input type="text" value={uniqueId} onChange={(e) => setUniqueId(e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div className="flex items-center">
                            <label className="w-28 text-sm font-medium text-gray-600 shrink-0">Name</label>
                            <span className="mx-2">:</span>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div className="flex items-center">
                            <label className="w-28 text-sm font-medium text-gray-600 shrink-0">Designation</label>
                            <span className="mx-2">:</span>
                            <select value={designation} onChange={(e) => {
                                if (e.target.value === "add-new") {
                                    setIsAddDesignationModalOpen(true);
                                    setDesignation(''); // Reset selection
                                } else {
                                    setDesignation(e.target.value);
                                }
                            }} className="flex-grow p-2 border border-gray-300 rounded-md" required>
                                <option value="">Select Designation</option>
                                {designations.map((d, index) => <option key={index} value={d.name}>{d.name}</option>)}
                                <option value="add-new">Add New Designation...</option> {/* New option */}
                            </select>
                        </div>
                         <div className="flex items-center">
                            <label className="w-28 text-sm font-medium text-gray-600 shrink-0">User Email</label>
                            <span className="mx-2">:</span>
                            <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-md" readOnly={!!editingUserId} required />
                        </div>
                        {!editingUserId && (
                            <>
                                <div className="relative flex items-center"> {/* Added relative positioning here */}
                                    <label className="w-28 text-sm font-medium text-gray-600 shrink-0">Set Password</label>
                                    <span className="mx-2">:</span>
                                    <input type={showSetPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-md pr-10" required /> {/* Added pr-10 */}
                                    <EyeIcon visible={showSetPassword} onClick={() => setShowSetPassword(!showSetPassword)} />
                                </div>
                                <div className="relative flex items-center"> {/* Added relative positioning here */}
                                    <label className="w-28 text-sm font-medium text-gray-600 shrink-0">Confirm Password</label>
                                    <span className="mx-2">:</span>
                                    <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-md pr-10" required /> {/* Added pr-10 */}
                                    <EyeIcon visible={showConfirmPassword} onClick={() => setShowConfirmPassword(!showConfirmPassword)} />
                                </div>
                            </>
                        )}
                        <div className="flex items-center">
                            <label className="w-28 text-sm font-medium text-gray-600 shrink-0">Assign Role</label>
                            <span className="mx-2">:</span>
                            <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-md">
                                <option value="consumer">Consumer</option>
                                <option value="caseworker">Caseworker</option>
                                <option value="approver">Approver</option>
                            </select>
                        </div>
                        <div className="flex gap-4">
                            {editingUserId && (
                                <button type="button" onClick={resetUserForm} className="w-full py-2 px-4 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600">Cancel</button>
                            )}
                            <button type="submit" className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
                                {editingUserId ? 'Update User' : 'Create User'}
                            </button>
                        </div>
                    </form>
                    <hr className="my-6"/>
                    <div className="flex-grow overflow-y-auto">
                        <table className="w-full text-left">
                           <thead>
                               <tr className="bg-gray-100">
                                   <th className="p-3 text-base font-semibold text-gray-600">ID</th>
                                   <th className="p-3 text-base font-semibold text-gray-600">Name</th>
                                   <th className="p-3 text-base font-semibold text-gray-600">Designation</th>
                                   <th className="p-3 text-base font-semibold text-gray-600">Email</th>
                                   <th className="p-3 text-base font-semibold text-gray-600">Role</th>
                                   <th className="p-3 text-base font-semibold text-gray-600">Action</th>
                               </tr>
                           </thead>
                           <tbody>
                               {users.map(u => (
                                   <tr key={u.id} className="border-b">
                                       <td className="p-3 text-sm">{u.uniqueId || 'N/A'}</td>
                                       <td className="p-3 text-sm">{u.name || 'N/A'}</td>
                                       <td className="p-3 text-sm">{u.designation || 'N/A'}</td>
                                       <td className="p-3 text-sm">{u.email || 'N/A'}</td>
                                       <td className="p-3 capitalize text-sm">{u.role || 'N/A'}</td>
                                       <td className="p-3 flex gap-2">
                                           <button onClick={() => handleEditUserClick(u)} className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200">Edit</button>
                                           <button onClick={() => handleDeleteUser(u.id)} className="text-sm px-2 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200">Delete</button>
                                       </td>
                                   </tr>
                               ))}
                               {users.length === 0 && <tr><td colSpan="6" className="text-center p-8 text-gray-500">No users found.</td></tr>}
                           </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex flex-col">
                    {/* Add/Edit Material Form */}
                    <div className="flex-shrink-0">
                        <h2 className="text-2xl font-semibold mb-4">{editingMaterialId ? 'Edit Material' : 'Add Material'}</h2>
                        <form onSubmit={handleMaterialFormSubmit} className="space-y-4 p-4 border rounded-md">
                            <div className="flex flex-wrap items-end gap-4">
    <div className="flex-grow min-w-[150px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">Material Name</label>
        <input type="text" value={newMaterialName} onChange={(e) => setNewMaterialName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required />
    </div>
    <div className="flex-grow min-w-[150px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">Material Type</label>
        <select value={newMaterialType} onChange={(e) => setNewMaterialType(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
            <option>Non-returnable</option>
            <option>Returnable</option>
        </select>
    </div>
    <div className="flex-grow min-w-[150px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">Material Information</label>
        <select value={newMaterialInfo} onChange={(e) => setNewMaterialInfo(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
            <option>Non-Electronic</option>
            <option>Electronic</option>
        </select>
    </div>
    <div className="flex gap-2">
        {editingMaterialId && (
            <button type="button" onClick={resetMaterialForm} className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600">Cancel</button>
        )}
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shrink-0">
            {editingMaterialId ? 'Update' : 'Add'}
        </button>
    </div>
</div>
                        </form>
                    </div>
                    <hr className="my-6 flex-shrink-0"/>
                    {/* Manage Materials Section */}
                    <div className="flex flex-col flex-grow min-h-0">
                        <h2 className="text-2xl font-semibold mb-4 flex-shrink-0">Manage Materials</h2>
                        <div className="grid grid-cols-2 gap-4 flex-grow min-h-0">
                            {/* Returnable Materials Column */}
                            <div className="flex flex-col min-h-0">
                                <h3 className="font-semibold text-lg mb-2 flex-shrink-0">Returnable Materials</h3>
                                <div className="border rounded-md overflow-y-auto max-h-96">
                                    <table className="w-full text-sm text-left">
                                        <thead className="sticky top-0 bg-gray-50">
                                            <tr>
                                                <th className="p-2 font-semibold">SL.NO</th>
                                                <th className="p-2 font-semibold">Name</th>
                                                <th className="p-2 font-semibold">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {returnableMaterials.map((material, index) => (
                                                <tr key={material.id} className="border-b last:border-b-0">
                                                    <td className="p-2">{index + 1}.</td>
                                                    <td className="p-2">{material.name}</td>
                                                    <td className="p-2 flex gap-2">
                                                        {confirmDeleteId === material.id ? (
                                                            <>
                                                                <button onClick={() => handleDeleteMaterial(material.id)} className="text-xs px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600">Confirm</button>
                                                                <button onClick={() => setConfirmDeleteId(null)} className="text-xs px-2 py-1 bg-gray-300 rounded-md hover:bg-gray-400">Cancel</button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => handleEditMaterialClick(material)} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200">Edit</button>
                                                                <button onClick={() => setConfirmDeleteId(material.id)} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200">Delete</button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {returnableMaterials.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-gray-500">No returnable materials found.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {/* Non-Returnable Materials Column */}
                            <div className="flex flex-col min-h-0">
                                <h3 className="font-semibold text-lg mb-2 flex-shrink-0">Non-returnable Materials</h3>
                                <div className="border rounded-md overflow-y-auto max-h-96">
                                    <table className="w-full text-sm text-left">
                                         <thead className="sticky top-0 bg-gray-50">
                                            <tr>
                                                <th className="p-2 font-semibold">SL.NO</th>
                                                <th className="p-2 font-semibold">Name</th>
                                                <th className="p-2 font-semibold">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {nonReturnableMaterials.map((material, index) => (
                                                <tr key={material.id} className="border-b last:border-b-0">
                                                    <td className="p-2">{index + 1}.</td>
                                                    <td className="p-2">{material.name}</td>
                                                    <td className="p-2 flex gap-2">
                                                        {confirmDeleteId === material.id ? (
                                                            <>
                                                                <button onClick={() => handleDeleteMaterial(material.id)} className="text-xs px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600">Confirm</button>
                                                                <button onClick={() => setConfirmDeleteId(null)} className="text-xs px-2 py-1 bg-gray-300 rounded-md hover:bg-gray-400">Cancel</button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => handleEditMaterialClick(material)} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200">Edit</button>
                                                                <button onClick={() => setConfirmDeleteId(material.id)} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200">Delete</button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {nonReturnableMaterials.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-gray-500">No non-returnable materials found.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            {isAddDesignationModalOpen && (
                <AddDesignationModal
                    onClose={() => setIsAddDesignationModalOpen(false)}
                    onAddDesignation={handleAddDesignation}
                />
            )}
        </div>
    );
}

// --- Caseworker Dashboard Component ---
function CaseworkerDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dataEntry');
  const NavTab = ({ tabId, children }) => (
    <button onClick={() => setActiveTab(tabId)} className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${ activeTab === tabId ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
      {children}
    </button>
  );
  const renderContent = () => {
    switch (activeTab) {
      case 'dataEntry': return <DataEntryForm user={user} />;
      case 'consumerHandover': return <ConsumerHandover />;
      case 'consumerItems': return <ConsumerItemsReport />;
      case 'annualVerification': return <AnnualVerificationReport user={user} />;
      case 'rejectedCase': return <RejectedCases />;
      case 'verificationHistory': return <VerificationHistoryTab />;
      case 'existingItems': return <ExistingItemsTabForCaseworker />;
      case 'reports': return <ReportsTab />;
      default: return <DataEntryForm user={user} />;
    }
  };
  return (
    <div className="flex flex-col h-screen p-4 md:p-8">
      <header className="flex-shrink-0 flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0">Caseworker Portal</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm md:text-base">{user.email}</span>
          <SettingsButton user={user} onLogout={onLogout} />
        </div>
      </header>
      <nav className="flex-shrink-0 mb-8 flex flex-wrap gap-2 p-2 bg-gray-100 rounded-lg">
        <NavTab tabId="dataEntry">Data Entry Form</NavTab>
        <NavTab tabId="consumerHandover">Consumer Handover</NavTab>
        <NavTab tabId="consumerItems">Consumer Items</NavTab>
        <NavTab tabId="annualVerification">Annual Verification Report</NavTab>
        <NavTab tabId="rejectedCase">Rejected Cases</NavTab>
        <NavTab tabId="verificationHistory">Verification History</NavTab>
        <NavTab tabId="existingItems">Existing Items</NavTab>
        <NavTab tabId="reports">Reports</NavTab>
      </nav>
      <main className="flex-grow overflow-hidden">{renderContent()}</main>
    </div>
  );
}

// --- Reports Tab Component (for Caseworker) [FIXED] ---
function ReportsTab() {
    const [reportData, setReportData] = useState([]);
    const [monthlyReportData, setMonthlyReportData] = useState([]);
    const [annualReportData, setAnnualReportData] = useState([]);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [activeReportTab, setActiveReportTab] = useState('dateReport');

    const handleGenerateDateReport = async () => {
        if (!fromDate || !toDate) {
            setReportData([]);
            return;
        }

        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);

        const approvalQuery = query(
            collection(db, "approval_requests"),
            where("billDate", ">=", fromDate),
            where("billDate", "<=", toDate)
        );
        const approvalSnapshot = await getDocs(approvalQuery);
        
        const purchasedMap = new Map();
        approvalSnapshot.forEach(doc => {
            const request = doc.data();
            if (request.status === 'approved' || request.status === 'partially-approved') {
                request.items.forEach(item => {
                    if (item.status === 'approved') {
                        const currentQty = purchasedMap.get(item.name) || 0;
                        purchasedMap.set(item.name, currentQty + parseInt(item.quantity, 10));
                    }
                });
            }
        });

        const distributionQuery = query(
            collection(db, "distribution_requests"),
            where("submittedAt", ">=", startDate),
            where("submittedAt", "<=", endDate)
        );
        const distributionSnapshot = await getDocs(distributionQuery);

        const distributedMap = new Map();
        distributionSnapshot.forEach(doc => {
            const request = doc.data();
            request.items.forEach(item => {
                if (item.status === 'collected') {
                    const currentQty = distributedMap.get(item.name) || 0;
                    distributedMap.set(item.name, currentQty + parseInt(item.requiredQuantity, 10));
                }
            });
        });

        const allMaterialNames = new Set([...purchasedMap.keys(), ...distributedMap.keys()]);
        
        const finalReportData = Array.from(allMaterialNames).map(name => {
            const totalPurchased = purchasedMap.get(name) || 0;
            const totalGiven = distributedMap.get(name) || 0;
            return {
                name,
                totalPurchased,
                totalGiven,
                totalBalance: totalPurchased - totalGiven,
            };
        });

        setReportData(finalReportData);
    };

    const handleGenerateMonthlyReport = async () => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const firstDayOfSelectedMonth = new Date(year, month - 1, 1);
        const lastDayOfSelectedMonth = new Date(year, month, 0);
        lastDayOfSelectedMonth.setHours(23, 59, 59, 999);

        const allMaterialsQuery = collection(db, 'materials');
        const materialsSnapshot = await getDocs(allMaterialsQuery);
        const allMaterialNames = materialsSnapshot.docs.map(doc => doc.data().name);

        const allPurchasesQuery = query(
            collection(db, "approval_requests"),
            where("billDate", "<=", selectedMonth + '-' + lastDayOfSelectedMonth.getDate())
        );
        const allPurchasesSnapshot = await getDocs(allPurchasesQuery);

        const allDistributionsQuery = query(
            collection(db, "distribution_requests"),
            where("submittedAt", "<=", lastDayOfSelectedMonth)
        );
        const allDistributionsSnapshot = await getDocs(allDistributionsQuery);

        const reportMap = new Map();
        allMaterialNames.forEach(name => {
            reportMap.set(name, {
                name, purchasedLastMonth: 0, purchasedThisMonth: 0,
                givenLastMonth: 0, givenThisMonth: 0, balance: 0,
            });
        });

        allPurchasesSnapshot.forEach(doc => {
            const request = doc.data();
            if (request.status === 'approved' || request.status === 'partially-approved') {
                const billDate = new Date(request.billDate);
                request.items.forEach(item => {
                    if (item.status === 'approved') {
                        const data = reportMap.get(item.name);
                        if (data) {
                            const quantity = parseInt(item.quantity, 10) || 0;
                            if (billDate < firstDayOfSelectedMonth) {
                                data.purchasedLastMonth += quantity;
                            } else {
                                data.purchasedThisMonth += quantity;
                            }
                        }
                    }
                });
            }
        });

        allDistributionsSnapshot.forEach(doc => {
            const request = doc.data();
            if (request.submittedAt) {
                const submittedAtDate = request.submittedAt.toDate();
                request.items.forEach(item => {
                    if (item.status === 'collected') {
                        const data = reportMap.get(item.name);
                        if (data) {
                            const quantity = parseInt(item.requiredQuantity, 10) || 0;
                            if (submittedAtDate < firstDayOfSelectedMonth) {
                                data.givenLastMonth += quantity;
                            } else {
                                data.givenThisMonth += quantity;
                            }
                        }
                    }
                });
            }
        });

        const finalReportData = Array.from(reportMap.values()).map(data => {
            const totalPurchased = data.purchasedLastMonth + data.purchasedThisMonth;
            const totalGiven = data.givenLastMonth + data.givenThisMonth;
            data.balance = totalPurchased - totalGiven;
            return data;
        }).filter(data => data.balance !== 0 || data.purchasedThisMonth > 0 || data.givenThisMonth > 0);

        setMonthlyReportData(finalReportData);
    };

    const handleGenerateAnnualReport = async () => {
        const year = parseInt(selectedYear, 10);
        const firstDayOfYear = new Date(year, 0, 1);
        const lastDayOfYear = new Date(year, 11, 31);
        lastDayOfYear.setHours(23, 59, 59, 999);

        const allMaterialsQuery = collection(db, 'materials');
        const materialsSnapshot = await getDocs(allMaterialsQuery);
        const allMaterialNames = materialsSnapshot.docs.map(doc => doc.data().name);

        const allPurchasesQuery = query(
            collection(db, "approval_requests"),
            where("billDate", "<=", `${year}-12-31`)
        );
        const allPurchasesSnapshot = await getDocs(allPurchasesQuery);

        const allDistributionsQuery = query(
            collection(db, "distribution_requests"),
            where("submittedAt", "<=", lastDayOfYear)
        );
        const allDistributionsSnapshot = await getDocs(allDistributionsQuery);

        const reportMap = new Map();
        allMaterialNames.forEach(name => {
            reportMap.set(name, {
                name, purchasedLastYear: 0, purchasedThisYear: 0,
                givenLastYear: 0, givenThisYear: 0, balance: 0,
            });
        });

        allPurchasesSnapshot.forEach(doc => {
            const request = doc.data();
            if (request.status === 'approved' || request.status === 'partially-approved') {
                const billDate = new Date(request.billDate);
                request.items.forEach(item => {
                    if (item.status === 'approved') {
                        const data = reportMap.get(item.name);
                        if (data) {
                            const quantity = parseInt(item.quantity, 10) || 0;
                            if (billDate < firstDayOfYear) {
                                data.purchasedLastYear += quantity;
                            } else {
                                data.purchasedThisYear += quantity;
                            }
                        }
                    }
                });
            }
        });

        allDistributionsSnapshot.forEach(doc => {
            const request = doc.data();
            if (request.submittedAt) {
                const submittedAtDate = request.submittedAt.toDate();
                request.items.forEach(item => {
                    if (item.status === 'collected') {
                        const data = reportMap.get(item.name);
                        if (data) {
                            const quantity = parseInt(item.requiredQuantity, 10) || 0;
                            if (submittedAtDate < firstDayOfYear) {
                                data.givenLastYear += quantity;
                            } else {
                                data.givenThisYear += quantity;
                            }
                        }
                    }
                });
            }
        });

        const finalReportData = Array.from(reportMap.values()).map(data => {
            const totalPurchased = data.purchasedLastYear + data.purchasedThisYear;
            const totalGiven = data.givenLastYear + data.givenThisYear;
            data.balance = totalPurchased - totalGiven;
            return data;
        }).filter(data => data.balance !== 0 || data.purchasedThisYear > 0 || data.givenThisYear > 0);

        setAnnualReportData(finalReportData);
    };

    useEffect(() => {
        if (activeReportTab === 'dateReport') {
            handleGenerateDateReport();
        } else if (activeReportTab === 'monthlyReport') {
            handleGenerateMonthlyReport();
        } else if (activeReportTab === 'annualReport') {
            handleGenerateAnnualReport();
        }
    }, [toDate, fromDate, activeReportTab, selectedMonth, selectedYear]);

    const exportToPDF = () => {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            alert("PDF export library is not loaded yet. Please try again in a moment.");
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
    
        if (typeof doc.autoTable !== 'function') {
            alert("PDF autoTable plugin is not loaded yet. Please try again in a moment.");
            return;
        }
        
        if (activeReportTab === 'dateReport') {
            doc.text("Date Wise Report", 14, 15);
            doc.autoTable({
                head: [['SL.NO', 'MATERIAL', 'TOTAL PURCHASED', 'TOTAL GIVEN', 'BALANCE']],
                body: reportData.map((row, index) => [
                    index + 1, row.name, row.totalPurchased, row.totalGiven, row.totalBalance,
                ]),
                startY: 20, theme: 'grid',
            });
            doc.save('date_report.pdf');
        } else if (activeReportTab === 'monthlyReport') {
            doc.text("Monthly Report", 14, 15);
            doc.autoTable({
                head: [
                    [{ content: 'SL.NO', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }, 
                     { content: 'MATERIAL', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }, 
                     { content: 'TOTAL PURCHASED', colSpan: 2, styles: { halign: 'center' } }, 
                     { content: 'TOTAL GIVEN', colSpan: 2, styles: { halign: 'center' } }, 
                     { content: 'BALANCE', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }],
                    ['UPTO LAST MONTH', 'THIS MONTH', 'UPTO LAST MONTH', 'THIS MONTH']
                ],
                body: monthlyReportData.map((row, index) => [
                    index + 1, row.name, row.purchasedLastMonth, row.purchasedThisMonth,
                    row.givenLastMonth, row.givenThisMonth, row.balance,
                ]),
                startY: 20, theme: 'grid', headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' }
            });
            doc.save('monthly_report.pdf');
        } else if (activeReportTab === 'annualReport') {
            doc.text("Annual Report", 14, 15);
            doc.autoTable({
                head: [
                    [{ content: 'SL.NO', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }, 
                     { content: 'MATERIAL', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }, 
                     { content: 'TOTAL PURCHASED', colSpan: 2, styles: { halign: 'center' } }, 
                     { content: 'TOTAL GIVEN', colSpan: 2, styles: { halign: 'center' } }, 
                     { content: 'BALANCE', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }],
                    ['UPTO LAST YEAR', 'THIS YEAR', 'UPTO LAST YEAR', 'THIS YEAR']
                ],
                body: annualReportData.map((row, index) => [
                    index + 1, row.name, row.purchasedLastYear, row.purchasedThisYear,
                    row.givenLastYear, row.givenThisYear, row.balance,
                ]),
                startY: 20, theme: 'grid', headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' }
            });
            doc.save('annual_report.pdf');
        }
    };

    const exportToDoc = () => {
        let content = '';
        let title = '';
        let headers = '';
        let body = '';

        if (activeReportTab === 'dateReport') {
            title = 'Date Wise Report';
            headers = '<th>SL.NO</th><th>MATERIAL</th><th>TOTAL PURCHASED</th><th>TOTAL GIVEN</th><th>BALANCE</th>';
            reportData.forEach((row, index) => {
                body += `<tr><td>${index + 1}</td><td>${row.name}</td><td>${row.totalPurchased}</td><td>${row.totalGiven}</td><td>${row.totalBalance}</td></tr>`;
            });
        } else if (activeReportTab === 'monthlyReport') {
            title = 'Monthly Report';
            headers = '<th rowspan="2">SL.NO</th><th rowspan="2">MATERIAL</th><th colspan="2">TOTAL PURCHASED</th><th colspan="2">TOTAL GIVEN</th><th rowspan="2">BALANCE</th></tr><tr><th>UPTO LAST MONTH</th><th>THIS MONTH</th><th>UPTO LAST MONTH</th><th>THIS MONTH</th>';
            monthlyReportData.forEach((row, index) => {
                body += `<tr><td>${index + 1}</td><td>${row.name}</td><td>${row.purchasedLastMonth}</td><td>${row.purchasedThisMonth}</td><td>${row.givenLastMonth}</td><td>${row.givenThisMonth}</td><td>${row.balance}</td></tr>`;
            });
        } else if (activeReportTab === 'annualReport') {
            title = 'Annual Report';
            headers = '<th rowspan="2">SL.NO</th><th rowspan="2">MATERIAL</th><th colspan="2">TOTAL PURCHASED</th><th colspan="2">TOTAL GIVEN</th><th rowspan="2">BALANCE</th></tr><tr><th>UPTO LAST YEAR</th><th>THIS YEAR</th><th>UPTO LAST YEAR</th><th>THIS YEAR</th>';
            annualReportData.forEach((row, index) => {
                body += `<tr><td>${index + 1}</td><td>${row.name}</td><td>${row.purchasedLastYear}</td><td>${row.purchasedThisYear}</td><td>${row.givenLastYear}</td><td>${row.givenThisYear}</td><td>${row.balance}</td></tr>`;
            });
        }
        
        content = `<html><head><title>${title}</title><style>body{font-family: Arial, sans-serif;} table{width:100%; border-collapse: collapse;} th, td{border: 1px solid #dddddd; text-align: left; padding: 8px;} tr:nth-child(even) {background-color: #f2f2f2;}</style></head><body><h1>${title}</h1><table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table></body></html>`;
        
        const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${activeReportTab}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToExcel = () => {
        if (!window.XLSX) { alert("Excel export library is not loaded yet. Please try again in a moment."); return; }
        
        let ws_data = [];
        let merges = [];

        if (activeReportTab === 'dateReport') {
            ws_data.push(['SL.NO', 'MATERIAL', 'TOTAL PURCHASED', 'TOTAL GIVEN', 'BALANCE']);
            reportData.forEach((row, index) => {
                ws_data.push([index + 1, row.name, row.totalPurchased, row.totalGiven, row.totalBalance]);
            });
        } else if (activeReportTab === 'monthlyReport') {
            ws_data = [
                ["", "", { t: 's', v: 'TOTAL PURCHASED' }, "", { t: 's', v: 'TOTAL GIVEN' }, ""],
                ['SL.NO', 'MATERIAL', 'UPTO LAST MONTH', 'THIS MONTH', 'UPTO LAST MONTH', 'THIS MONTH', 'BALANCE']
            ];
            monthlyReportData.forEach((row, index) => {
                ws_data.push([index + 1, row.name, row.purchasedLastMonth, row.purchasedThisMonth, row.givenLastMonth, row.givenThisMonth, row.balance]);
            });
            merges = [{ s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }, { s: { r: 0, c: 4 }, e: { r: 0, c: 5 } }];
        } else if (activeReportTab === 'annualReport') {
            ws_data = [
                ["", "", { t: 's', v: 'TOTAL PURCHASED' }, "", { t: 's', v: 'TOTAL GIVEN' }, ""],
                ['SL.NO', 'MATERIAL', 'UPTO LAST YEAR', 'THIS YEAR', 'UPTO LAST YEAR', 'THIS YEAR', 'BALANCE']
            ];
            annualReportData.forEach((row, index) => {
                ws_data.push([index + 1, row.name, row.purchasedLastYear, row.purchasedThisYear, row.givenLastYear, row.givenThisYear, row.balance]);
            });
            merges = [{ s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }, { s: { r: 0, c: 4 }, e: { r: 0, c: 5 } }];
        }

        const ws = window.XLSX.utils.aoa_to_sheet(ws_data);
        if (merges.length > 0) ws['!merges'] = merges;
        const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
        window.XLSX.writeFile(wb, `${activeReportTab}.xlsx`);
    };

    const ReportTabButton = ({ tabId, children }) => (
        <button
            onClick={() => setActiveReportTab(tabId)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${activeReportTab === tabId ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
            {isExportModalOpen && <ExportModal onClose={() => setIsExportModalOpen(false)} exportToPDF={exportToPDF} exportToDoc={exportToDoc} exportToExcel={exportToExcel} />}
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">Reports</h2>
            <div className="flex items-center gap-4 mb-6 border-b pb-4">
                <ReportTabButton tabId="dateReport">Date Report</ReportTabButton>
                <ReportTabButton tabId="monthlyReport">Monthly report</ReportTabButton>
                <ReportTabButton tabId="annualReport">Annual report</ReportTabButton>
                <div className="flex-grow"></div>
                <button onClick={() => setIsExportModalOpen(true)} className="self-end px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Export</button>
            </div>
            
            {activeReportTab === 'dateReport' && (
                 <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">From date:</label>
                        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="p-2 border border-gray-300 rounded-md" />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">To date:</label>
                        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="p-2 border border-gray-300 rounded-md" />
                    </div>
                </div>
            )}
            
            {activeReportTab === 'monthlyReport' && (
                <div className="flex items-center gap-2 mb-6">
                    <label className="text-sm font-medium text-gray-700">Select Month:</label>
                    <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="p-2 border border-gray-300 rounded-md" />
                </div>
            )}

            {activeReportTab === 'annualReport' && (
                <div className="flex items-center gap-2 mb-6">
                    <label className="text-sm font-medium text-gray-700">Select Year:</label>
                    <input type="number" placeholder="YYYY" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="p-2 border border-gray-300 rounded-md w-24" />
                </div>
            )}

            <div className="flex-grow overflow-y-auto">
                {activeReportTab === 'dateReport' && (
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-gray-600">SL.NO</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">MATERIAL</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">TOTAL PURCHASED</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">TOTAL GIVEN</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">BALANCE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length === 0 ? (
                                <tr><td colSpan="5" className="text-center p-8 text-gray-500">No data to display.</td></tr>
                            ) : (
                                reportData.map((row, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="p-3">{index + 1}</td>
                                        <td className="p-3">{row.name}</td>
                                        <td className="p-3">{row.totalPurchased}</td>
                                        <td className="p-3">{row.totalGiven}</td>
                                        <td className="p-3">{row.totalBalance}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
                {activeReportTab === 'monthlyReport' && (
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-gray-600" rowSpan="2">SL.NO</th>
                                <th className="p-3 text-sm font-semibold text-gray-600" rowSpan="2">MATERIAL</th>
                                <th className="p-3 text-sm font-semibold text-gray-600 text-center" colSpan="2">TOTAL PURCHASED</th>
                                <th className="p-3 text-sm font-semibold text-gray-600 text-center" colSpan="2">TOTAL GIVEN</th>
                                <th className="p-3 text-sm font-semibold text-gray-600" rowSpan="2">BALANCE</th>
                            </tr>
                            <tr>
                                <th className="p-3 text-sm font-semibold text-gray-600">UPTO LAST MONTH</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">THIS MONTH</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">UPTO LAST MONTH</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">THIS MONTH</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyReportData.length === 0 ? (
                                <tr><td colSpan="7" className="text-center p-8 text-gray-500">No data to display. Select a month and data will generate automatically.</td></tr>
                            ) : (
                                monthlyReportData.map((row, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="p-3">{index + 1}</td>
                                        <td className="p-3">{row.name}</td>
                                        <td className="p-3">{row.purchasedLastMonth}</td>
                                        <td className="p-3">{row.purchasedThisMonth}</td>
                                        <td className="p-3">{row.givenLastMonth}</td>
                                        <td className="p-3">{row.givenThisMonth}</td>
                                        <td className="p-3">{row.balance}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
                 {activeReportTab === 'annualReport' && (
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-gray-600" rowSpan="2">SL.NO</th>
                                <th className="p-3 text-sm font-semibold text-gray-600" rowSpan="2">MATERIAL</th>
                                <th className="p-3 text-sm font-semibold text-gray-600 text-center" colSpan="2">TOTAL PURCHASED</th>
                                <th className="p-3 text-sm font-semibold text-gray-600 text-center" colSpan="2">TOTAL GIVEN</th>
                                <th className="p-3 text-sm font-semibold text-gray-600" rowSpan="2">BALANCE</th>
                            </tr>
                            <tr>
                                <th className="p-3 text-sm font-semibold text-gray-600">UPTO LAST YEAR</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">THIS YEAR</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">UPTO LAST YEAR</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">THIS YEAR</th>
                            </tr>
                        </thead>
                        <tbody>
                            {annualReportData.length === 0 ? (
                                <tr><td colSpan="7" className="text-center p-8 text-gray-500">No data to display. Select a year and data will generate automatically.</td></tr>
                            ) : (
                                annualReportData.map((row, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="p-3">{index + 1}</td>
                                        <td className="p-3">{row.name}</td>
                                        <td className="p-3">{row.purchasedLastYear}</td>
                                        <td className="p-3">{row.purchasedThisYear}</td>
                                        <td className="p-3">{row.givenLastYear}</td>
                                        <td className="p-3">{row.givenThisYear}</td>
                                        <td className="p-3">{row.balance}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

// --- Existing Items Tab (for Caseworker) [NEW] ---
function ExistingItemsTabForCaseworker() {
    const [returnableItems, setReturnableItems] = useState([]);
    const [nonReturnableItems, setNonReturnableItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(query(collection(db, "approval_requests")), (approvalSnapshot) => {
            onSnapshot(query(collection(db, "distribution_requests")), (distributionSnapshot) => {
                
                const approvedNonReturnableMap = new Map();
                const approvedReturnableMap = new Map();

                approvalSnapshot.forEach(doc => {
                    const request = doc.data();
                    if (request.status === 'approved' || request.status === 'partially-approved') {
                        request.items.forEach(item => {
                            if (item.status === 'approved') {
                                const quantity = parseInt(item.quantity, 10) || 0;
                                if (item.type === 'Returnable') {
                                    const key = `${item.name}-${item.serialNumber}-${item.modelNumber}`;
                                    const existing = approvedReturnableMap.get(key);
                                    if (existing) {
                                        existing.quantity += quantity;
                                    } else {
                                        approvedReturnableMap.set(key, { ...item, quantity });
                                    }
                                } else {
                                    const existing = approvedNonReturnableMap.get(item.name);
                                    if (existing) {
                                        existing.quantity += quantity;
                                    } else {
                                        approvedNonReturnableMap.set(item.name, { ...item, quantity });
                                    }
                                }
                            }
                        });
                    }
                });

                const distributedQuantities = new Map();
                distributionSnapshot.forEach(doc => {
                    doc.data().items.forEach(item => {
                        if (['pending', 'approved', 'collected'].includes(item.status)) {
                            const quantity = parseInt(item.requiredQuantity, 10) || 0;
                            const key = item.type === 'Returnable' ? `${item.name}-${item.serialNumber}-${item.modelNumber}` : item.name;
                            const currentQty = distributedQuantities.get(key) || 0;
                            distributedQuantities.set(key, currentQty + quantity);
                        }
                    });
                });

                const finalNonReturnable = [];
                approvedNonReturnableMap.forEach((item, name) => {
                    const distributedQty = distributedQuantities.get(name) || 0;
                    const presentQuantity = item.quantity - distributedQty;
                    if (presentQuantity > 0) {
                        finalNonReturnable.push({ ...item, quantity: presentQuantity });
                    }
                });

                const finalReturnable = [];
                approvedReturnableMap.forEach((item, key) => {
                    const distributedQty = distributedQuantities.get(key) || 0;
                    const presentQuantity = item.quantity - distributedQty;
                    if (presentQuantity > 0) {
                        finalReturnable.push({ ...item, quantity: presentQuantity });
                    }
                });
                
                setReturnableItems(finalReturnable);
                setNonReturnableItems(finalNonReturnable);
                setLoading(false);
            });
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="text-center p-8">Loading stock...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Non-Returnable Materials</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 font-semibold">SL.NO</th>
                                <th className="p-3 font-semibold">MATERIAL NAME</th>
                                <th className="p-3 font-semibold">INFO</th>
                                <th className="p-3 font-semibold">PRESENT QUANTITY</th>
                            </tr>
                        </thead>
                        <tbody>
                            {nonReturnableItems.length > 0 ? nonReturnableItems.map((item, index) => (
                                <tr key={item.name} className="border-b">
                                    <td className="p-3">{index + 1}</td>
                                    <td className="p-3">{item.name}</td>
                                    <td className="p-3">{item.info}</td>
                                    <td className="p-3">{item.quantity}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="text-center p-8 text-gray-500">No items in this category.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Returnable Material</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 font-semibold">SL.NO</th>
                                <th className="p-3 font-semibold">MATERIAL NAME</th>
                                <th className="p-3 font-semibold">INFO</th>
                                <th className="p-3 font-semibold">SERIAL NO</th>
                                <th className="p-3 font-semibold">MODEL NO</th>
                                <th className="p-3 font-semibold">PRESENT QUANTITY</th>
                            </tr>
                        </thead>
                        <tbody>
                            {returnableItems.length > 0 ? returnableItems.map((item, index) => (
                                <tr key={`${item.name}-${item.serialNumber}`} className="border-b">
                                    <td className="p-3">{index + 1}</td>
                                    <td className="p-3">{item.name}</td>
                                    <td className="p-3">{item.info}</td>
                                    <td className="p-3">{item.serialNumber || 'N/A'}</td>
                                    <td className="p-3">{item.modelNumber || 'N/A'}</td>
                                    <td className="p-3">{item.quantity}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="text-center p-8 text-gray-500">No items in this category.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// --- Verification History Tab (for Caseworker) [NEW] ---
function VerificationHistoryTab() {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const q = query(collection(db, "annual_verification_requests"), where("status", "!=", "pending"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setHistory(historyData);
        });
        return () => unsubscribe();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB');
    };
    
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate();
        return date.toLocaleDateString('en-GB');
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">Annual Verification History</h2>
            <div className="flex-grow overflow-y-auto">
                {history.length === 0 ? (
                    <p className="text-gray-500 text-center mt-8">No verification history found.</p>
                ) : (
                    history.map(request => (
                        <div key={request.id} className="mb-6 p-4 border rounded-md">
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div><span className="font-semibold">Request ID:</span> {request.id}</div>
                                <div><span className="font-semibold">Date Submitted:</span> {formatTimestamp(request.submittedAt)}</div>
                                <div><span className="font-semibold">Status:</span> <span className={`font-bold ${request.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}`}>{request.status}</span></div>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-2">Material</th>
                                        <th className="p-2">Serial No</th>
                                        <th className="p-2">Original Condition</th>
                                        <th className="p-2">New Condition</th>
                                        <th className="p-2">Verified Date</th>
                                        <th className="p-2">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {request.items.map(item => (
                                        <tr key={item.id} className="border-b">
                                            <td className="p-2">{item.name}</td>
                                            <td className="p-2">{item.serialNumber}</td>
                                            <td className="p-2">{item.productCondition}</td>
                                            <td className="p-2">{item.newCondition}</td>
                                            <td className="p-2">{formatDate(item.physicallyVerifiedDate)}</td>
                                            <td className="p-2">{item.remarks || '---'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}


// --- Annual Verification Report Component (for Caseworker) [NEW] ---
function AnnualVerificationReport({ user }) {
    const [returnableItems, setReturnableItems] = useState([]);
    const [users, setUsers] = useState({});
    const [itemConditions, setItemConditions] = useState({});
    const [approvalRequests, setApprovalRequests] = useState({});

    useEffect(() => {
        const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            const usersMap = {};
            snapshot.forEach(doc => {
                usersMap[doc.id] = doc.data();
            });
            setUsers(usersMap);
        });

        const unsubscribeApprovalRequests = onSnapshot(collection(db, 'approval_requests'), (snapshot) => {
            const requestsMap = {};
            snapshot.forEach(doc => {
                requestsMap[doc.id] = doc.data();
            });
            setApprovalRequests(requestsMap);
        });

        const q = query(collection(db, "distribution_requests"));
        const unsubscribeDistribution = onSnapshot(q, (snapshot) => {
            const allReturnable = [];
            snapshot.forEach(doc => {
                const request = doc.data();
                request.items.forEach((item, index) => {
                    if (item.type === 'Returnable' && item.status === 'collected') {
                        allReturnable.push({
                            ...item,
                            id: `${doc.id}-${index}`,
                            consumerId: request.consumerId,
                            distributionId: doc.id,
                        });
                    }
                });
            });
            setReturnableItems(allReturnable);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeApprovalRequests();
            unsubscribeDistribution();
        };
    }, []);

    const handleConditionChange = (itemId, condition) => {
        setItemConditions(prev => ({ ...prev, [itemId]: condition }));
    };

    const handleSendToApproval = async () => {
        const itemsToVerify = returnableItems.filter(item => itemConditions[item.id]);
        if (itemsToVerify.length === 0) {
            alert("Please update the condition of at least one item before sending for approval.");
            return;
        }

        const verificationData = {
            caseworkerId: user.uid,
            caseworkerEmail: user.email,
            submittedAt: serverTimestamp(),
            status: 'pending',
            items: itemsToVerify.map(item => ({
                ...item,
                newCondition: itemConditions[item.id]
            }))
        };

        try {
            await addDoc(collection(db, 'annual_verification_requests'), verificationData);
            alert("Annual verification request sent for approval.");
            setItemConditions({});
        } catch (error) {
            console.error("Error sending verification request: ", error);
            alert("Failed to send verification request.");
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate();
        return date.toLocaleDateString('en-GB');
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">Annual Verification Report</h2>
            <div className="flex-grow overflow-y-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 sticky top-0">
                        <tr>
                            <th className="p-3 text-sm font-semibold text-gray-600">Sl.No</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">Material Name</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">Model</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">Serial Number</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">Quantity</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">Consumer Name</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">Designation</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">Date of Taken</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">Condition of the Material</th>
                            <th className="p-3 text-sm font-semibold text-gray-600">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {returnableItems.map((item, index) => {
                            const consumer = users[item.consumerId] || {};
                            return (
                                <tr key={item.id} className="border-b">
                                    <td className="p-3">{index + 1}</td>
                                    <td className="p-3">{item.name}</td>
                                    <td className="p-3">{item.modelNumber}</td>
                                    <td className="p-3">{item.serialNumber}</td>
                                    <td className="p-3">{item.requiredQuantity}</td>
                                    <td className="p-3">{consumer.name}</td>
                                    <td className="p-3">{consumer.designation}</td>
                                    <td className="p-3">{formatDate(item.dateTaken)}</td>
                                    <td className="p-3">
                                        <select
                                            value={itemConditions[item.id] || item.productCondition}
                                            onChange={(e) => handleConditionChange(item.id, e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        >
                                            <option>Good</option>
                                            <option>Normal</option>
                                            <option>Bad</option>
                                            <option>For Disposal</option>
                                        </select>
                                    </td>
                                    <td className="p-3 capitalize">{item.status}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end mt-6">
                <button onClick={handleSendToApproval} className="px-6 py-2 bg-yellow-500 text-white font-semibold rounded-md hover:bg-yellow-600">
                    SEND TO APPROVAL
                </button>
            </div>
        </div>
    );
}


// --- Rejected Cases Component (for Caseworker) ---
function RejectedCases() {
    const [rejectedItems, setRejectedItems] = useState([]);

    useEffect(() => {
        const q = query(collection(db, "approval_requests"), where("status", "in", ["rejected", "partially-approved"]));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allRejected = [];
            snapshot.forEach(doc => {
                const request = doc.data();
                request.items.forEach(item => {
                    if (item.status === 'rejected') {
                        allRejected.push({
                            ...item,
                            vendorName: request.vendorName,
                            billNumber: request.billNumber,
                            billDate: request.billDate,
                        });
                    }
                });
            });
            setRejectedItems(allRejected);
        });
        return () => unsubscribe();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full overflow-y-auto">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">Rejected Cases</h2>
            <table className="w-full text-left">
                <thead className="bg-gray-100 sticky top-0">
                    <tr>
                        <th className="p-3 text-sm font-semibold text-gray-600">Sl.No</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Vendor Name</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Bill Number</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Bill Date</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Material</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Quantity</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Cost</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    {rejectedItems.length === 0 ? (
                        <tr><td colSpan="8" className="text-center p-8 text-gray-500">No rejected items found.</td></tr>
                    ) : (
                        rejectedItems.map((item, index) => (
                            <tr key={`${item.billNumber}-${item.id}`} className="border-b">
                                <td className="p-3">{index + 1}</td>
                                <td className="p-3">{item.vendorName}</td>
                                <td className="p-3">{item.billNumber}</td>
                                <td className="p-3">{formatDate(item.billDate)}</td>
                                <td className="p-3">{item.name}</td>
                                <td className="p-3">{item.quantity}</td>
                                <td className="p-3">₹{item.cost}</td>
                                <td className="p-3">{item.remarks}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

// --- Consumer Items Report Component (for Caseworker) ---
function ConsumerItemsReport() {
    const [collectedItems, setCollectedItems] = useState([]);
    const [users, setUsers] = useState({});
    const [materials, setMaterials] = useState({});

    // Helper to format Firestore Timestamp to DD/MM/YYYY
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate();
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    useEffect(() => {
        const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            const usersMap = {};
            snapshot.forEach(doc => {
                usersMap[doc.id] = doc.data();
            });
            setUsers(usersMap);
        });

        const unsubscribeMaterials = onSnapshot(collection(db, 'materials'), (snapshot) => {
            const materialsMap = {};
            snapshot.forEach(doc => {
                materialsMap[doc.data().name] = doc.data();
            });
            setMaterials(materialsMap);
        });

        const q = query(collection(db, "distribution_requests"));
        const unsubscribeRequests = onSnapshot(q, (snapshot) => {
            const allCollected = [];
            snapshot.forEach(doc => {
                const request = doc.data();
                request.items.forEach(item => {
                    if (item.status === 'collected') {
                        allCollected.push({
                            ...item,
                            consumerId: request.consumerId,
                        });
                    }
                });
            });
            setCollectedItems(allCollected);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeMaterials();
            unsubscribeRequests();
        };
    }, []);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full overflow-y-auto">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">Collected Consumer Items Report</h2>
            <table className="w-full text-left">
                <thead className="bg-gray-100 sticky top-0">
                    <tr>
                        <th className="p-3 text-sm font-semibold text-gray-600">Sl.No</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Consumer Name</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Designation</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Date Taken</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Material</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Type</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Info</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Quantity</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Messenger Name</th>
                    </tr>
                </thead>
                <tbody>
                    {collectedItems.length === 0 ? (
                        <tr><td colSpan="9" className="text-center p-8 text-gray-500">No collected items found.</td></tr>
                    ) : (
                        collectedItems.map((item, index) => {
                            const consumerInfo = users[item.consumerId] || {};
                            const materialInfo = materials[item.name] || {};
                            return (
                                <tr key={index} className="border-b">
                                    <td className="p-3">{index + 1}</td>
                                    <td className="p-3">{consumerInfo.name || 'N/A'}</td>
                                    <td className="p-3">{consumerInfo.designation || 'N/A'}</td>
                                    <td className="p-3">{formatDate(item.dateTaken)}</td>
                                    <td className="p-3">{item.name}</td>
                                    <td className="p-3">{materialInfo.type || 'N/A'}</td>
                                    <td className="p-3">{materialInfo.info || 'N/A'}</td>
                                    <td className="p-3">{item.requiredQuantity}</td>
                                    <td className="p-3">{item.messengerName || 'N/A'}</td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}


// --- Consumer Handover Component (for Caseworker) [FIXED] ---
function ConsumerHandover() {
    const [itemsForHandover, setItemsForHandover] = useState([]);
    const [users, setUsers] = useState({});
    const [messengerNames, setMessengerNames] = useState({});
    const [availableReturnableStock, setAvailableReturnableStock] = useState({});
    const [selectedSerials, setSelectedSerials] = useState({});

    useEffect(() => {
        // Fetches all user data
        const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            const usersMap = {};
            snapshot.forEach(doc => {
                usersMap[doc.id] = doc.data();
            });
            setUsers(usersMap);
        });

        // Fetches all approved items for handover
        const q = query(collection(db, "distribution_requests"), where("status", "in", ["approved", "partially-approved"]));
        const unsubscribeRequests = onSnapshot(q, (snapshot) => {
            const allItems = [];
            snapshot.forEach(doc => {
                const request = { id: doc.id, ...doc.data() };
                request.items.forEach((item, index) => {
                    if (item.status === 'approved') {
                        allItems.push({
                            ...item,
                            uniqueId: `${doc.id}-${index}`, // A unique key for each item in the list
                            itemIndex: index, // Track the item's original index
                            requestId: request.id,
                            consumerId: request.consumerId,
                        });
                    }
                });
            });
            setItemsForHandover(allItems);
        });

        // Fetches available serial numbers for returnable items
        const unsubscribeStock = onSnapshot(query(collection(db, "approval_requests")), (approvalSnapshot) => {
            const stock = {};
            approvalSnapshot.forEach(doc => {
                if (doc.data().status === 'approved' || doc.data().status === 'partially-approved') {
                    doc.data().items.forEach(item => {
                        if (item.status === 'approved' && item.type === 'Returnable') {
                            if (!stock[item.name]) {
                                stock[item.name] = [];
                            }
                            stock[item.name].push({ serialNumber: item.serialNumber, modelNumber: item.modelNumber });
                        }
                    });
                }
            });
            setAvailableReturnableStock(stock);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeRequests();
            unsubscribeStock();
        };
    }, []);

    const handleItemUpdate = async (item, newStatus) => {
        const { requestId, name, type, uniqueId, itemIndex } = item;
        const messengerName = messengerNames[uniqueId] || '';
        const selectedSerialInfo = selectedSerials[uniqueId] || {};
    
        if (type === 'Returnable' && newStatus === 'collected' && (!selectedSerialInfo.serialNumber || !selectedSerialInfo.modelNumber)) {
            alert("Please select a serial and model number for this returnable item.");
            return;
        }
        if (newStatus === 'collected' && !messengerName) {
            alert("Please enter the messenger's name before confirming collection.");
            return;
        }
    
        const requestDocRef = doc(db, "distribution_requests", requestId);
    
        try {
            await runTransaction(db, async (transaction) => {
                const requestDoc = await transaction.get(requestDocRef);
                if (!requestDoc.exists()) throw new Error("Document does not exist!");
    
                const requestData = requestDoc.data();
                const newItems = [...requestData.items]; // Create a mutable copy
    
                // Ensure the item exists at the specified index before updating
                if (itemIndex >= 0 && itemIndex < newItems.length) {
                    const updatedItem = {
                        ...newItems[itemIndex], // Start with the original item data
                        status: newStatus,
                        dateTaken: newStatus === 'collected' ? new Date() : null,
                        messengerName: newStatus === 'collected' ? messengerName : '',
                    };
    
                    // Only add serial/model numbers for returnable items being collected
                    if (type === 'Returnable' && newStatus === 'collected') {
                        updatedItem.serialNumber = selectedSerialInfo.serialNumber || '';
                        updatedItem.modelNumber = selectedSerialInfo.modelNumber || '';
                    }
    
                    newItems[itemIndex] = updatedItem; // Replace the old item with the updated one
                } else {
                    console.error("Invalid item index:", itemIndex);
                    throw new Error("Could not find the item to update.");
                }
    
                const allItemsHandled = newItems.every(i => i.status === 'collected' || i.status === 'rejected');
                const finalStatus = allItemsHandled ? 'completed' : requestData.status;
    
                transaction.update(requestDocRef, { items: newItems, status: finalStatus });
            });
            alert(`Item ${name} has been marked as ${newStatus}.`);
    
        } catch (error) {
            console.error("Transaction failed: ", error);
            alert("Failed to update item status. Please try again.");
        }
    };
    
    const handleMessengerNameChange = (key, value) => {
        setMessengerNames(prev => ({ ...prev, [key]: value }));
    };

    const handleSerialChange = (key, value) => {
        const [serialNumber, modelNumber] = value.split('|');
        setSelectedSerials(prev => ({ ...prev, [key]: { serialNumber, modelNumber } }));
    };

    const nonReturnableItems = itemsForHandover.filter(item => item.type !== 'Returnable');
    const returnableItems = itemsForHandover.filter(item => item.type === 'Returnable');

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full overflow-y-auto space-y-8">
            <div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-6">Approved Non-Returnable Requests</h2>
                {nonReturnableItems.length === 0 ? (
                    <p className="text-gray-500 text-center mt-8">No non-returnable items are currently pending handover.</p>
                ) : (
                     <table className="w-full text-left">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-gray-600">Sl.No</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">Consumer Name</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">Designation</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">Material</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">Quantity</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">Messenger Name</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {nonReturnableItems.map((item, index) => {
                                const consumerInfo = users[item.consumerId] || {};
                                return (
                                    <tr key={item.uniqueId} className="border-b">
                                        <td className="p-3">{index + 1}</td>
                                        <td className="p-3">{consumerInfo.name || 'N/A'}</td>
                                        <td className="p-3">{consumerInfo.designation || 'N/A'}</td>
                                        <td className="p-3">{item.name}</td>
                                        <td className="p-3">{item.requiredQuantity}</td>
                                        <td className="p-3">
                                            <input type="text" placeholder="Enter Name" className="w-full p-2 border border-gray-300 rounded-md" value={messengerNames[item.uniqueId] || ''} onChange={(e) => handleMessengerNameChange(item.uniqueId, e.target.value)} />
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleItemUpdate(item, 'collected')} className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 w-8 h-8 flex items-center justify-center" title="Confirm Collection">✓</button>
                                                <button onClick={() => handleItemUpdate(item, 'rejected')} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 w-8 h-8 flex items-center justify-center" title="Reject Collection">✗</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            <div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-6">Approved Returnable Requests</h2>
                {returnableItems.length === 0 ? (
                    <p className="text-gray-500 text-center mt-8">No returnable items are currently pending handover.</p>
                ) : (
                     <table className="w-full text-left">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-gray-600">Sl.No</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">Consumer Name</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">Designation</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">Material</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">Quantity</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">Serial Number</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">Model Number</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">Messenger Name</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {returnableItems.map((item, index) => {
                                const consumerInfo = users[item.consumerId] || {};
                                const availableSerials = availableReturnableStock[item.name] || [];
                                const selectedValue = selectedSerials[item.uniqueId] ? `${selectedSerials[item.uniqueId].serialNumber}|${selectedSerials[item.uniqueId].modelNumber}` : "";
                                return (
                                    <tr key={item.uniqueId} className="border-b">
                                        <td className="p-3">{index + 1}</td>
                                        <td className="p-3">{consumerInfo.name || 'N/A'}</td>
                                        <td className="p-3">{consumerInfo.designation || 'N/A'}</td>
                                        <td className="p-3">{item.name}</td>
                                        <td className="p-3">{item.requiredQuantity}</td>
                                        <td className="p-3">
                                            <select className="w-full p-2 border border-gray-300 rounded-md" value={selectedValue} onChange={(e) => handleSerialChange(item.uniqueId, e.target.value)}>
                                                <option value="">Select Serial No</option>
                                                {availableSerials.map(stockItem => (
                                                    <option key={stockItem.serialNumber} value={`${stockItem.serialNumber}|${stockItem.modelNumber}`}>{stockItem.serialNumber}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-3">
                                            <input type="text" readOnly value={selectedSerials[item.uniqueId]?.modelNumber || ''} className="w-full p-2 bg-gray-100 border border-gray-300 rounded-md" />
                                        </td>
                                        <td className="p-3">
                                            <input type="text" placeholder="Enter Name" className="w-full p-2 border border-gray-300 rounded-md" value={messengerNames[item.uniqueId] || ''} onChange={(e) => handleMessengerNameChange(item.uniqueId, e.target.value)} />
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleItemUpdate(item, 'collected')} className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 w-8 h-8 flex items-center justify-center" title="Confirm Collection">✓</button>
                                                <button onClick={() => handleItemUpdate(item, 'rejected')} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 w-8 h-8 flex items-center justify-center" title="Reject Collection">✗</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}


// --- Data Entry Form Component [FIXED] ---
function DataEntryForm({ user }) {
  const [vendorName, setVendorName] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [billDate, setBillDate] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [numMaterials, setNumMaterials] = useState('');
  const [costPerMaterial, setCostPerMaterial] = useState('');
  const [pendingRecords, setPendingRecords] = useState([]);
  const [historicalRecords, setHistoricalRecords] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [bulkAddData, setBulkAddData] = useState(null);
  const [gstAmount, setGstAmount] = useState('');
  const [totalAmount, setTotalAmount] = useState('0.00');
  const [editingRecordId, setEditingRecordId] = useState(null);
  
  const currentMaterialDetails = materials.find(m => m.name === selectedMaterial);
  const isAddItemDisabled = !selectedMaterial || !numMaterials || !costPerMaterial;

  useEffect(() => {
    const materialsCollection = collection(db, 'materials');
    const unsubscribe = onSnapshot(materialsCollection, (snapshot) => {
      const materialsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMaterials(materialsData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
      if (!user) return;
      const q = query(collection(db, "approval_requests"), where("caseworkerId", "==", user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const records = [];
          querySnapshot.forEach(doc => {
              const data = doc.data();
              data.items.forEach(item => {
                  records.push({ 
                      ...item, 
                      vendorName: data.vendorName,
                      vendorPhone: data.vendorPhone,
                      vendorAddress: data.vendorAddress,
                      billNumber: data.billNumber,
                      gstNumber: data.gstNumber,
                      billDate: data.billDate,
                      status: item.status || data.status
                  });
              });
          });
          records.sort((a, b) => {
              const statusOrder = { 'approved': 1, 'rejected': 2, 'pending': 3 };
              return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
          });
          setHistoricalRecords(records);
      });
      return () => unsubscribe();
  }, [user]);
  
  useEffect(() => {
    const subtotal = pendingRecords.reduce((acc, record) => acc + parseFloat(record.cost || 0), 0);
    const gst = parseFloat(gstAmount) || 0;
    setTotalAmount((subtotal + gst).toFixed(2));
  }, [gstAmount, pendingRecords]);

  const handleAddItem = () => {
    if (!vendorName || !vendorPhone || !vendorAddress || !billDate || !billNumber || !gstNumber) {
      alert("Please fill all vendor details before adding items.");
      return;
    }

    if (isAddItemDisabled) {
      alert("Please fill in material name, number, and cost.");
      return;
    }

    // If the item is Returnable, always use the bulk add modal to capture serial numbers.
    if (currentMaterialDetails.type === 'Returnable') {
        setBulkAddData({
            name: selectedMaterial,
            type: currentMaterialDetails.type,
            info: currentMaterialDetails.info,
            quantity: parseInt(numMaterials, 10),
            costPerItem: parseFloat(costPerMaterial).toFixed(2)
        });
        setIsBulkAddModalOpen(true);
        return;
    }

    // This logic now only applies to Non-Returnable items.
    const totalCost = parseFloat(numMaterials) * parseFloat(costPerMaterial);
    const newRecord = {
      id: editingRecordId || Date.now(),
      name: selectedMaterial,
      type: currentMaterialDetails.type,
      info: currentMaterialDetails.info,
      quantity: numMaterials,
      cost: totalCost.toFixed(2),
    };

    if (editingRecordId) {
        setPendingRecords(pendingRecords.map(rec => rec.id === editingRecordId ? newRecord : rec));
    } else {
        setPendingRecords([...pendingRecords, newRecord]);
    }
    resetFormFields();
  };

  const resetFormFields = () => {
    setSelectedMaterial('');
    setNumMaterials('');
    setCostPerMaterial('');
    setEditingRecordId(null);
  }
  
  const handleEdit = (record) => {
    // Note: Editing items with serial numbers will now require deleting and re-adding via the modal.
    setEditingRecordId(record.id);
    setSelectedMaterial(record.name);
    setNumMaterials(record.quantity);
    setCostPerMaterial(parseFloat(record.cost) / parseFloat(record.quantity));
  };

  const handleDelete = (recordId) => {
      setPendingRecords(pendingRecords.filter(rec => rec.id !== recordId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vendorName || !vendorPhone || !vendorAddress || !billDate || !billNumber || !gstNumber || pendingRecords.length === 0) {
      alert("Please fill all vendor details and add at least one material record.");
      return;
    }
     if (!gstAmount) {
        alert("Please enter the GST Amount before submitting.");
        return;
    }
    try {
      await addDoc(collection(db, 'approval_requests'), {
        vendorName, vendorPhone, vendorAddress, billDate, billNumber, gstNumber,
        caseworkerId: user.uid, caseworkerEmail: user.email,
        items: pendingRecords, gstAmount: gstAmount, totalAmount: totalAmount,
        status: 'pending', submittedAt: serverTimestamp(),
      });
      alert("Request submitted for approval successfully!");
      setPendingRecords([]); setVendorName(''); setVendorPhone(''); setVendorAddress('');
      setBillDate(''); setBillNumber(''); setGstNumber(''); setGstAmount('');
    } catch (error) {
      console.error("Error submitting request: ", error);
      alert("Failed to submit request. Please try again.");
    }
  };

  const handleBillDateChange = (e) => {
      const selectedDate = new Date(e.target.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedUtcDate = new Date(selectedDate.getTime() + selectedDate.getTimezoneOffset() * 60000);
      if (selectedUtcDate > today) {
          alert("Invalid date. Please do not select a future date.");
          setBillDate('');
      } else {
          setBillDate(e.target.value);
      }
  };

  const formatDateForExport = (dateString) => {
      if (!dateString) return '';
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
  };

  const exportToPDF = () => {
    if (!window.jspdf || !window.jspdf.jsPDF) { 
        alert("PDF export library is not loaded yet. Please try again in a moment."); 
        return; 
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    const tableColumn = ["SL", "VENDOR", "PHONE", "ADDRESS", "BILL NO", "GST NO", "BILL DATE", "MATERIAL", "TYPE", "INFO", "QTY", "COST", "STATUS"];
    const tableRows = [];

    [...historicalRecords, ...pendingRecords].forEach((record, index) => {
        const recordData = [
            index + 1, 
            record.vendorName || vendorName, 
            record.vendorPhone || vendorPhone,
            record.vendorAddress || vendorAddress, 
            record.billNumber || billNumber, 
            record.gstNumber || gstNumber,
            formatDateForExport(record.billDate || billDate),
            `${record.name} ${record.serialNumber ? `(${record.serialNumber}/${record.modelNumber})` : ''}`,
            record.type, 
            record.info, 
            record.quantity, 
            record.cost, 
            record.status || 'Pending'
        ];
        tableRows.push(recordData);
    });

    doc.text("Material Records", 14, 15);
    doc.autoTable({
        head: [tableColumn], 
        body: tableRows, 
        startY: 20, 
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fontSize: 8, fillColor: [34, 139, 34], textColor: 255 },
        columnStyles: {
            3: { cellWidth: 40 }, // Address
            7: { cellWidth: 35 }  // Material
        }
    });
    doc.save("material_records.pdf");
  };

  const exportToExcel = () => {
    if (!window.XLSX) { alert("Excel export library is not loaded yet. Please try again in a moment."); return; }
    
    const header = ["SL.NO", "VENDOR", "VENDOR PHONE", "VENDOR ADDRESS", "BILL NUMBER", "GST NUMBER", "BILL DATE", "MATERIAL", "TYPE", "INFO", "QUANTITY", "COST", "STATUS"];
    const body = [...historicalRecords, ...pendingRecords].map((record, index) => ([
        index + 1,
        record.vendorName || vendorName,
        record.vendorPhone || vendorPhone,
        record.vendorAddress || vendorAddress,
        record.billNumber || billNumber,
        record.gstNumber || gstNumber,
        formatDateForExport(record.billDate || billDate),
        `${record.name} ${record.serialNumber ? `(${record.serialNumber}/${record.modelNumber})` : ''}`,
        record.type,
        record.info,
        parseInt(record.quantity, 10),
        parseFloat(record.cost),
        record.status || 'Pending'
    ]));

    const ws = window.XLSX.utils.aoa_to_sheet([header, ...body]);
    // Set column widths
    ws['!cols'] = [
        { wch: 5 },  // SL.NO
        { wch: 20 }, // VENDOR
        { wch: 15 }, // VENDOR PHONE
        { wch: 30 }, // VENDOR ADDRESS
        { wch: 15 }, // BILL NUMBER
        { wch: 15 }, // GST NUMBER
        { wch: 12 }, // BILL DATE
        { wch: 30 }, // MATERIAL
        { wch: 15 }, // TYPE
        { wch: 15 }, // INFO
        { wch: 10 }, // QUANTITY
        { wch: 12 }, // COST
        { wch: 12 }  // STATUS
    ];

    const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
    window.XLSX.writeFile(wb, "material_records.xlsx");
  };

  const exportToDoc = () => {
    let header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Material Records</title>
        <style>
            @page {
                size: A4 landscape;
                margin: 1.25cm;
            }
            body { 
                font-family: Arial, sans-serif; 
            }
            .container {
                text-align: center;
            }
            h1 { text-align: center; font-size: 16pt; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #dddddd; text-align: center; padding: 8px; font-size: 7pt; }
            th { background-color: #f2f2f2; font-weight: bold; }
        </style>
        </head><body><div class="container">`;
    let table = '<h1>Material Records</h1><table><thead><tr><th>SL.NO</th><th>VENDOR</th><th>PHONE</th><th>ADDRESS</th><th>BILL NO</th><th>GST NO</th><th>BILL DATE</th><th>MATERIAL</th><th>TYPE</th><th>INFO</th><th>QTY</th><th>COST</th><th>STATUS</th></tr></thead><tbody>';
    
    [...historicalRecords, ...pendingRecords].forEach((record, index) => {
        table += `<tr>
            <td>${index + 1}</td> 
            <td>${record.vendorName || vendorName}</td> 
            <td>${record.vendorPhone || vendorPhone}</td>
            <td>${record.vendorAddress || vendorAddress}</td> 
            <td>${record.billNumber || billNumber}</td> 
            <td>${record.gstNumber || gstNumber}</td>
            <td>${formatDateForExport(record.billDate || billDate)}</td> 
            <td>${record.name} ${record.serialNumber ? `(${record.serialNumber}/${record.modelNumber})` : ''}</td>
            <td>${record.type}</td> 
            <td>${record.info}</td> 
            <td>${record.quantity}</td> 
            <td>${record.cost}</td> 
            <td>${record.status || 'Pending'}</td>
        </tr>`;
    });

    let footer = '</tbody></table></div></body></html>';
    let sourceHTML = header + table + footer;

    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'material_records.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkAdd = (items) => {
    setPendingRecords([...pendingRecords, ...items]);
    resetFormFields();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      {isBulkAddModalOpen && (
          <BulkAddModal
              data={bulkAddData}
              onClose={() => setIsBulkAddModalOpen(false)}
              onConfirm={handleBulkAdd}
          />
      )}
      <div className="lg:w-1/2 bg-white p-6 rounded-lg shadow-md overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">Material Entry Form</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-md space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Vendor Name</label>
                  <input type="text" placeholder="Enter Vendor Name" className="w-full p-2 border border-gray-300 rounded-md" value={vendorName} onChange={e => setVendorName(e.target.value)} required />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Vendor Phone</label>
                  <input type="text" pattern="\d*" maxLength="10" placeholder="Enter 10-digit Phone" className="w-full p-2 border border-gray-300 rounded-md" value={vendorPhone} onChange={e => { const val = e.target.value.replace(/\D/g, ''); setVendorPhone(val); }} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Vendor Address</label>
              <textarea placeholder="Enter Address" className="w-full p-2 border border-gray-300 rounded-md" value={vendorAddress} onChange={e => setVendorAddress(e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Bill Number</label>
                <input type="text" placeholder="Enter Bill Number" className="w-full p-2 border border-gray-300 rounded-md" value={billNumber} onChange={e => setBillNumber(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Bill Date</label>
                <input type="date" className="w-full p-2 border border-gray-300 rounded-md" value={billDate} onChange={handleBillDateChange} required />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">GST Number</label>
                <input type="text" placeholder="Enter GST Number" className="w-full p-2 border border-gray-300 rounded-md" value={gstNumber} onChange={e => setGstNumber(e.target.value)} required />
              </div>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-md space-y-4">
            <h3 className="font-semibold text-gray-700">Add Item</h3>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Material Name</label>
              <select className="w-full p-2 border border-gray-300 rounded-md" value={selectedMaterial} onChange={(e) => setSelectedMaterial(e.target.value)}>
                <option value="">Select Material</option>
                {materials.map(mat => <option key={mat.id} value={mat.name}>{mat.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <input type="text" pattern="\d*" placeholder="Number of Materials" className="w-full p-2 border border-gray-300 rounded-md" value={numMaterials} onChange={e => setNumMaterials(e.target.value.replace(/\D/g, ''))} />
                <input type="text" placeholder="Cost Per Material" className="w-full p-2 border border-gray-300 rounded-md" value={costPerMaterial} onChange={e => { const val = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1'); setCostPerMaterial(val); }} />
            </div>
            <div>
                <button type="button" onClick={handleAddItem} disabled={isAddItemDisabled} className={`w-full py-2 px-4 text-white font-semibold rounded-md transition-colors ${ isAddItemDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                    {editingRecordId ? 'Update Item' : 'Add Item'}
                </button>
            </div>
          </div>
          <hr className="my-4"/>
          <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="GST Amount" value={gstAmount} onChange={e => { const val = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1'); setGstAmount(val); }} className="w-full p-2 border border-gray-300 rounded-md" />
              <input type="text" readOnly value={`₹${totalAmount}`} className="w-full p-2 bg-gray-100 border border-gray-300 rounded-md" placeholder="Total Amount" />
          </div>
          <div>
            <button type="submit" className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-gray-400" disabled={pendingRecords.length === 0 || !gstAmount}>Submit for Approval</button>
          </div>
        </form>
      </div>
      <div className="lg:w-1/2 bg-white p-6 rounded-lg shadow-md flex flex-col">
        <div className="flex-shrink-0 flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">Material Records</h2>
          <button onClick={() => setIsExportModalOpen(true)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Export</button>
        </div>
        <div className="flex-grow overflow-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-gray-100">
              <tr >
                <th className="p-3 text-sm font-semibold text-gray-600">SL.NO</th>
                <th className="p-3 text-sm font-semibold text-gray-600">MATERIAL</th>
                <th className="p-3 text-sm font-semibold text-gray-600">TYPE</th>
                <th className="p-3 text-sm font-semibold text-gray-600">INFO</th>
                <th className="p-3 text-sm font-semibold text-gray-600">QTY</th>
                <th className="p-3 text-sm font-semibold text-gray-600">COST</th>
                <th className="p-3 text-sm font-semibold text-gray-600">STATUS</th>
                <th className="p-3 text-sm font-semibold text-gray-600">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {historicalRecords.length === 0 && pendingRecords.length === 0 ? (
                <tr><td colSpan="8" className="text-center p-8 text-gray-500">No records found.</td></tr>
              ) : (
                <>
                  {historicalRecords.map((record, index) => (
                    <tr key={`${record.id}-${index}`} className="border-b border-gray-200 bg-gray-50 opacity-70">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">{record.name}{record.serialNumber && <span className="block text-xs text-gray-500">({record.serialNumber} / {record.modelNumber})</span>}</td>
                      <td className="p-3">{record.type}</td>
                      <td className="p-3">{record.info}</td>
                      <td className="p-3">{record.quantity}</td>
                      <td className="p-3">₹{record.cost}</td>
                      <td className="p-3 capitalize">{record.status}</td>
                      <td className="p-3"></td>
                    </tr>
                  ))}
                  {pendingRecords.map((record, index) => (
                    <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-3">{historicalRecords.length + index + 1}</td>
                       <td className="p-3">{record.name}{record.serialNumber && <span className="block text-xs text-gray-500">({record.serialNumber} / {record.modelNumber})</span>}</td>
                      <td className="p-3">{record.type}</td>
                      <td className="p-3">{record.info}</td>
                      <td className="p-3">{record.quantity}</td>
                      <td className="p-3">₹{record.cost}</td>
                      <td className="p-3 capitalize">Pending</td>
                      <td className="p-3"><div className="flex gap-2"><button type="button" onClick={() => handleEdit(record)} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200">Edit</button><button type="button" onClick={() => handleDelete(record.id)} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200">Delete</button></div></td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {isExportModalOpen && <ExportModal onClose={() => setIsExportModalOpen(false)} exportToPDF={exportToPDF} exportToDoc={exportToDoc} exportToExcel={exportToExcel} />}
    </div>
  );
}

// --- Bulk Add Modal Component [NEW] ---
function BulkAddModal({ data, onClose, onConfirm }) {
    const { name, quantity, costPerItem, type, info } = data;
    const [items, setItems] = useState(() => 
        Array.from({ length: quantity }, () => ({ serialNumber: '', modelNumber: '', productCondition: '' }))
    );

    const handleInputChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleConfirm = () => {
        for (const item of items) {
            if (!item.serialNumber || !item.modelNumber || !item.productCondition) {
                alert("Please fill in all details for every item.");
                return;
            }
        }
        
        const newRecords = items.map(item => ({
            id: Date.now() + Math.random(), // Simple unique ID for local state
            name,
            type,
            info,
            quantity: 1,
            cost: costPerItem,
            serialNumber: item.serialNumber,
            modelNumber: item.modelNumber,
            productCondition: item.productCondition
        }));

        onConfirm(newRecords);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-3xl flex flex-col" style={{ maxHeight: '90vh' }}>
                <h2 className="text-2xl font-bold mb-6">Enter Details for {quantity} {name}s</h2>
                <div className="flex-grow overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="p-3 font-semibold">SL.NO</th>
                                <th className="p-3 font-semibold">SERIAL NUMBER</th>
                                <th className="p-3 font-semibold">MODEL NUMBER</th>
                                <th className="p-3 font-semibold">CONDITION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index} className="border-b">
                                    <td className="p-2">{index + 1}</td>
                                    <td className="p-2">
                                        <input type="text" value={item.serialNumber} onChange={(e) => handleInputChange(index, 'serialNumber', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                                    </td>
                                    <td className="p-2">
                                        <input type="text" value={item.modelNumber} onChange={(e) => handleInputChange(index, 'modelNumber', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                                    </td>
                                    <td className="p-2">
                                        <select value={item.productCondition} onChange={(e) => handleInputChange(index, 'productCondition', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                                            <option value="">Select Condition</option>
                                            <option>Good</option>
                                            <option>Normal</option>
                                            <option>Bad</option>
                                            <option>For Disposal</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end pt-6 gap-4">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="button" onClick={handleConfirm} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Confirm & Add Items</button>
                </div>
            </div>
        </div>
    );
}

// --- Placeholder Component for empty sections ---
function PlaceholderComponent({ title }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md h-full">
      <h2 className="text-2xl font-semibold text-gray-700">{title}</h2>
      <p className="mt-4 text-gray-500">This section is under development and will be available in a future update.</p>
    </div>
  );
}

// --- Manage Materials Modal ---
function ManageMaterialsModal({ materials, onClose }) {
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialType, setNewMaterialType] = useState('Non-returnable');
  const [newMaterialInfo, setNewMaterialInfo] = useState('Non-Electronic');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!newMaterialName) { alert("Please enter a material name."); return; }
    try {
      await addDoc(collection(db, 'materials'), { name: newMaterialName, type: newMaterialType, info: newMaterialInfo });
      setNewMaterialName('');
    } catch (error) {
      console.error("Error adding new material: ", error);
      alert("Failed to add material.");
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    try {
        await deleteDoc(doc(db, 'materials', materialId));
        setConfirmDeleteId(null);
    } catch (error) {
        console.error("Error deleting material: ", error);
        alert("Failed to delete material.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Manage Materials</h2>
        <form onSubmit={handleAddMaterial} className="space-y-4 p-4 border rounded-md mb-6">
          <h3 className="font-semibold text-lg">Add New Material</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Material Name</label>
            <input type="text" value={newMaterialName} onChange={(e) => setNewMaterialName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Type</label>
            <select value={newMaterialType} onChange={(e) => setNewMaterialType(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
              <option>Non-returnable</option>
              <option>Returnable</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Information</label>
            <select value={newMaterialInfo} onChange={(e) => setNewMaterialInfo(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
              <option>Non-Electronic</option>
              <option>Electronic</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Add Material</button>
          </div>
        </form>
        <div className="space-y-2">
            <h3 className="font-semibold text-lg">Existing Materials</h3>
            <div className="max-h-48 overflow-y-auto border rounded-md">
                {materials.length === 0 ? (<p className="text-gray-500 p-4 text-center">No materials found.</p>) : (
                    materials.map(material => (
                        <div key={material.id} className="flex justify-between items-center p-2 border-b last:border-b-0">
                            <span className="text-gray-800">{material.name}</span>
                            {confirmDeleteId === material.id ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-red-600">Sure?</span>
                                    <button onClick={() => handleDeleteMaterial(material.id)} className="px-3 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600">Yes</button>
                                    <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1 text-xs bg-gray-300 rounded-md hover:bg-gray-400">No</button>
                                </div>
                            ) : (
                                <button onClick={() => setConfirmDeleteId(material.id)} className="text-red-500 hover:text-red-700 font-bold text-xl w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors" title={`Remove ${material.name}`}>&ndash;</button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
        <div className="flex justify-end pt-6">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
}

// --- Export Modal Component ---
function ExportModal({ onClose, exportToPDF, exportToDoc, exportToExcel }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-sm">
                <h2 className="text-2xl font-bold mb-6 text-center">Export Records</h2>
                <div className="space-y-4">
                    <button onClick={exportToPDF} className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Export as PDF</button>
                    <button onClick={exportToDoc} className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Export as DOC</button>
                    <button onClick={exportToExcel} className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Export as Excel</button>
                </div>
                <div className="flex justify-center pt-6">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                </div>
            </div>
        </div>
    );
}

// --- Existing Items Tab (for Approver) [UPDATED] ---
function ExistingItemsTab() {
    const [returnableItems, setReturnableItems] = useState([]);
    const [nonReturnableItems, setNonReturnableItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(query(collection(db, "approval_requests")), (approvalSnapshot) => {
            onSnapshot(query(collection(db, "distribution_requests")), (distributionSnapshot) => {
                
                const approvedNonReturnableMap = new Map();
                const approvedReturnableMap = new Map();

                approvalSnapshot.forEach(doc => {
                    const request = doc.data();
                    if (request.status === 'approved' || request.status === 'partially-approved') {
                        request.items.forEach(item => {
                            if (item.status === 'approved') {
                                const quantity = parseInt(item.quantity, 10) || 0;
                                if (item.type === 'Returnable') {
                                    const key = `${item.name}-${item.serialNumber}-${item.modelNumber}`;
                                    const existing = approvedReturnableMap.get(key);
                                    if (existing) {
                                        existing.quantity += quantity;
                                    } else {
                                        approvedReturnableMap.set(key, { ...item, quantity });
                                    }
                                } else {
                                    const existing = approvedNonReturnableMap.get(item.name);
                                    if (existing) {
                                        existing.quantity += quantity;
                                    } else {
                                        approvedNonReturnableMap.set(item.name, { ...item, quantity });
                                    }
                                }
                            }
                        });
                    }
                });

                const distributedQuantities = new Map();
                distributionSnapshot.forEach(doc => {
                    doc.data().items.forEach(item => {
                        if (['pending', 'approved', 'collected'].includes(item.status)) {
                            const quantity = parseInt(item.requiredQuantity, 10) || 0;
                            const key = item.type === 'Returnable' ? `${item.name}-${item.serialNumber}-${item.modelNumber}` : item.name;
                            const currentQty = distributedQuantities.get(key) || 0;
                            distributedQuantities.set(key, currentQty + quantity);
                        }
                    });
                });

                const finalNonReturnable = [];
                approvedNonReturnableMap.forEach((item, name) => {
                    const distributedQty = distributedQuantities.get(name) || 0;
                    const presentQuantity = item.quantity - distributedQty;
                    if (presentQuantity > 0) {
                        finalNonReturnable.push({ ...item, quantity: presentQuantity });
                    }
                });

                const finalReturnable = [];
                approvedReturnableMap.forEach((item, key) => {
                    const distributedQty = distributedQuantities.get(key) || 0;
                    const presentQuantity = item.quantity - distributedQty;
                    if (presentQuantity > 0) {
                        finalReturnable.push({ ...item, quantity: presentQuantity });
                    }
                });
                
                setReturnableItems(finalReturnable);
                setNonReturnableItems(finalNonReturnable);
                setLoading(false);
            });
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="text-center p-8">Loading stock...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Non-Returnable Materials</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 font-semibold">SL.NO</th>
                                <th className="p-3 font-semibold">MATERIAL NAME</th>
                                <th className="p-3 font-semibold">INFO</th>
                                <th className="p-3 font-semibold">PRESENT QUANTITY</th>
                            </tr>
                        </thead>
                        <tbody>
                            {nonReturnableItems.length > 0 ? nonReturnableItems.map((item, index) => (
                                <tr key={item.name} className="border-b">
                                    <td className="p-3">{index + 1}</td>
                                    <td className="p-3">{item.name}</td>
                                    <td className="p-3">{item.info}</td>
                                    <td className="p-3">{item.quantity}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="text-center p-8 text-gray-500">No items in this category.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Returnable Material</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 font-semibold">SL.NO</th>
                                <th className="p-3 font-semibold">MATERIAL NAME</th>
                                <th className="p-3 font-semibold">INFO</th>
                                <th className="p-3 font-semibold">SERIAL NO</th>
                                <th className="p-3 font-semibold">MODEL NO</th>
                                <th className="p-3 font-semibold">PRESENT QUANTITY</th>
                            </tr>
                        </thead>
                        <tbody>
                            {returnableItems.length > 0 ? returnableItems.map((item, index) => (
                                <tr key={`${item.name}-${item.serialNumber}`} className="border-b">
                                    <td className="p-3">{index + 1}</td>
                                    <td className="p-3">{item.name}</td>
                                    <td className="p-3">{item.info}</td>
                                    <td className="p-3">{item.serialNumber || 'N/A'}</td>
                                    <td className="p-3">{item.modelNumber || 'N/A'}</td>
                                    <td className="p-3">{item.quantity}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="text-center p-8 text-gray-500">No items in this category.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}


// --- Approver Dashboard ---
function ApproverDashboard({ user, onLogout }) {
    const [activeTab, setActiveTab] = useState('careWorkerRequest');

    const NavTab = ({ tabId, children }) => (
        <button 
            onClick={() => setActiveTab(tabId)} 
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 focus:outline-none ${
                activeTab === tabId 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          {children}
        </button>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'caseWorkerRequest': return <CaseWorkerRequestTab />;
            case 'consumerRequest': return <ConsumerRequestTab />;
            case 'existingItems': return <ExistingItemsTab />;
            case 'annualVerification': return <AnnualVerificationTab />;
            default: return <CaseWorkerRequestTab />;
        }
    };

    return (
        <div className="flex flex-col h-screen p-4 md:p-8 bg-gray-50">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Approval Portal</h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-600">{user.email}</span>
                    <SettingsButton user={user} onLogout={onLogout} />
                </div>
            </header>
            <nav className="flex-shrink-0 border-b border-gray-200">
                <div className="flex space-x-4">
                    <NavTab tabId="caseWorkerRequest">Case Worker Request</NavTab>
                    <NavTab tabId="consumerRequest">Consumer Request</NavTab>
                    <NavTab tabId="existingItems">Existing Items</NavTab>
                    <NavTab tabId="annualVerification">Annual Verification</NavTab>
                </div>
            </nav>
            <main className="flex-grow overflow-y-auto pt-6">
                {renderContent()}
            </main>
        </div>
    );
}

// --- Annual Verification Tab (for Approver) [FIXED] ---
function AnnualVerificationTab() {
    const [verificationRequests, setVerificationRequests] = useState([]);
    const [users, setUsers] = useState({});
    const [approverConditions, setApproverConditions] = useState({});
    const [verifiedDates, setVerifiedDates] = useState({});

    useEffect(() => {
        const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            const usersMap = {};
            snapshot.forEach(doc => {
                usersMap[doc.id] = doc.data();
            });
            setUsers(usersMap);
        });

        const q = query(collection(db, "annual_verification_requests"), where("status", "==", "pending"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setVerificationRequests(requests);
            // Initialize the approver conditions state
            const initialConditions = {};
            requests.forEach(req => {
                req.items.forEach(item => {
                    initialConditions[item.id] = item.newCondition;
                });
            });
            setApproverConditions(initialConditions);
        });
        
        return () => {
            unsubscribeUsers();
            unsubscribe();
        };
    }, []);
    
    const handleApproverConditionChange = (itemId, condition) => {
        setApproverConditions(prev => ({ ...prev, [itemId]: condition }));
    };
    
    const handleDateChange = (itemId, date) => {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate > today) {
            alert("Invalid date. Please do not select a future date.");
            return;
        }
        setVerifiedDates(prev => ({ ...prev, [itemId]: date }));
    };

    const handleApproval = async (request, newStatus) => {
        const { id: requestId, items } = request;
        const verificationRequestRef = doc(db, "annual_verification_requests", requestId);
    
        try {
            await runTransaction(db, async (transaction) => {
                // --- READ PHASE ---
                // First, read all the necessary distribution documents if the status is 'verified-changed'.
                const distributionDocsToUpdate = new Map();
                if (newStatus === 'verified-changed') {
                    // Create a map of distribution IDs to the items that need updating within them.
                    const updatesByDocId = items.reduce((acc, item) => {
                        const finalCondition = approverConditions[item.id] || item.newCondition;
                        if (!acc[item.distributionId]) {
                            acc[item.distributionId] = [];
                        }
                        acc[item.distributionId].push({ ...item, newCondition: finalCondition });
                        return acc;
                    }, {});

                    // Asynchronously fetch all unique distribution documents that need updating.
                    const readPromises = Object.keys(updatesByDocId).map(distId => {
                        const distDocRef = doc(db, "distribution_requests", distId);
                        return transaction.get(distDocRef).then(docSnapshot => ({
                            id: distId,
                            ref: distDocRef,
                            snapshot: docSnapshot,
                            itemsToUpdate: updatesByDocId[distId]
                        }));
                    });
                    
                    const results = await Promise.all(readPromises);
                    
                    results.forEach(result => {
                        if (!result.snapshot.exists()) {
                            throw new Error(`Distribution document ${result.id} not found!`);
                        }
                        distributionDocsToUpdate.set(result.id, result);
                    });
                }
    
                // --- WRITE PHASE ---
                // Now that all reads are done, we can proceed with writes.
    
                // 1. Update the main annual verification request.
                const updatedItemsForRequest = items.map(item => {
                    const conditionChanged = approverConditions[item.id] && approverConditions[item.id] !== item.newCondition;
                    return {
                        ...item,
                        remarks: conditionChanged ? "Physically Verified and Changed" : "",
                        physicallyVerifiedDate: conditionChanged ? (verifiedDates[item.id] || '') : ''
                    };
                });
                transaction.update(verificationRequestRef, { status: newStatus, items: updatedItemsForRequest });
    
                // 2. If necessary, update the related distribution documents.
                if (newStatus === 'verified-changed') {
                    distributionDocsToUpdate.forEach(docInfo => {
                        const originalItems = docInfo.snapshot.data().items;
                        const updatedItems = originalItems.map(originalItem => {
                            const matchingUpdate = docInfo.itemsToUpdate.find(
                                updateItem => updateItem.serialNumber === originalItem.serialNumber
                            );
                            if (matchingUpdate) {
                                return { ...originalItem, productCondition: matchingUpdate.newCondition };
                            }
                            return originalItem;
                        });
                        transaction.update(docInfo.ref, { items: updatedItems });
                    });
                }
            });
            alert(`Request has been successfully processed as ${newStatus}.`);
        } catch (error) {
            console.error("Error processing verification request: ", error);
            alert("Failed to process the request. Please try again.");
        }
    };
    
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate();
        return date.toLocaleDateString('en-GB');
    };

    return (
        <div className="space-y-6">
            {verificationRequests.length === 0 ? (
                <p className="text-gray-500 text-center mt-8">No pending annual verification requests.</p>
            ) : (
                verificationRequests.map(request => {
                    const isAnyConditionChanged = request.items.some(item => approverConditions[item.id] && approverConditions[item.id] !== item.newCondition);
                    return (
                        <div key={request.id} className="bg-white p-6 rounded-lg shadow-md">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Caseworker</label>
                                    <p className="font-semibold">{request.caseworkerEmail}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Date Submitted</label>
                                    <p className="font-semibold">{formatDate(request.submittedAt)}</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-3 font-semibold">Sl.No</th>
                                            <th className="p-3 font-semibold">Material Name</th>
                                            <th className="p-3 font-semibold">Model</th>
                                            <th className="p-3 font-semibold">Serial Number</th>
                                            <th className="p-3 font-semibold">Consumer Name</th>
                                            <th className="p-3 font-semibold">Date of Taken</th>
                                            <th className="p-3 font-semibold">New Condition</th>
                                            <th className="p-3 font-semibold">Verified Date</th>
                                            <th className="p-3 font-semibold">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {request.items.map((item, index) => {
                                            const consumer = users[item.consumerId] || {};
                                            const conditionChanged = approverConditions[item.id] && approverConditions[item.id] !== item.newCondition;
                                            return (
                                                <tr key={item.id} className="border-b">
                                                    <td className="p-3">{index + 1}</td>
                                                    <td className="p-3">{item.name}</td>
                                                    <td className="p-3">{item.modelNumber}</td>
                                                    <td className="p-3">{item.serialNumber}</td>
                                                    <td className="p-3">{consumer.name || 'N/A'}</td>
                                                    <td className="p-3">{formatDate(item.dateTaken)}</td>
                                                    <td className="p-3">
                                                        <select
                                                            value={approverConditions[item.id] || item.newCondition}
                                                            onChange={(e) => handleApproverConditionChange(item.id, e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded-md"
                                                        >
                                                            <option>Good</option>
                                                            <option>Normal</option>
                                                            <option>Bad</option>
                                                            <option>For Disposal</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-3">
                                                        {conditionChanged && (
                                                            <input
                                                                type="date"
                                                                className="w-full p-2 border border-gray-300 rounded-md"
                                                                value={verifiedDates[item.id] || ''}
                                                                onChange={(e) => handleDateChange(item.id, e.target.value)}
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="p-3">
                                                        {conditionChanged && "Physically Verified and Changed"}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-end mt-6 gap-4">
                                {isAnyConditionChanged && (
                                    <button onClick={() => handleApproval(request, 'verified-changed')} className="px-6 py-2 bg-yellow-500 text-white font-semibold rounded-md hover:bg-yellow-600">
                                        Verified and Changed
                                    </button>
                                )}
                                <button onClick={() => handleApproval(request, 'approved')} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">
                                    Approve
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}

function CaseWorkerRequestTab() {
    const [requests, setRequests] = useState([]);
    const [itemStates, setItemStates] = useState({});

    useEffect(() => {
        const q = query(collection(db, "approval_requests"), where("status", "==", "pending"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const requestsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRequests(requestsData);
        });
        return () => unsubscribe();
    }, []);

    const handleStatusChange = (requestId, itemId, status) => {
        setItemStates(prev => ({
            ...prev,
            [requestId]: {
                ...prev[requestId],
                [itemId]: { ...prev[requestId]?.[itemId], status }
            }
        }));
    };

    const handleRemarkChange = (requestId, itemId, remarks) => {
        setItemStates(prev => ({
            ...prev,
            [requestId]: {
                ...prev[requestId],
                [itemId]: { ...prev[requestId]?.[itemId], remarks }
            }
        }));
    };

    const handleSubmitApprovals = async (requestId) => {
        const requestDocRef = doc(db, "approval_requests", requestId);
        const currentRequestState = itemStates[requestId] || {};

        try {
            await runTransaction(db, async (transaction) => {
                const requestDoc = await transaction.get(requestDocRef);
                if (!requestDoc.exists()) {
                    throw new Error("Document does not exist!");
                }

                const originalItems = requestDoc.data().items;
                let allApproved = true;
                let anyApproved = false;

                const updatedItems = originalItems.map(item => {
                    const itemState = currentRequestState[item.id];
                    if (itemState && (itemState.status === 'approved' || itemState.status === 'rejected')) {
                        if (itemState.status !== 'approved') allApproved = false;
                        if (itemState.status === 'approved') anyApproved = true;
                        return { ...item, status: itemState.status, remarks: itemState.remarks || '' };
                    }
                    allApproved = false; // An item was left pending
                    return item;
                });
                
                // Determine the overall status of the request
                const finalStatus = allApproved ? 'approved' : anyApproved ? 'partially-approved' : 'rejected';

                transaction.update(requestDocRef, { items: updatedItems, status: finalStatus });
            });
            alert("Approvals submitted successfully!");
        } catch (error) {
            console.error("Error submitting approvals: ", error);
            alert("Failed to submit approvals. Please try again.");
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    return (
        <div className="space-y-6">
            {requests.length === 0 ? (
                <p className="text-gray-500 text-center mt-8">No pending requests from Case Workers.</p>
            ) : (
                requests.map(request => (
                    <div key={request.id} className="bg-white p-6 rounded-lg shadow-md">
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Vendor Name</label>
                                <p className="font-semibold">{request.vendorName}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Bill No.</label>
                                <p className="font-semibold">{request.billNumber}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Bill Date</label>
                                <p className="font-semibold">{formatDate(request.billDate)}</p>
                            </div>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-3 font-semibold">SL.NO</th>
                                    <th className="p-3 font-semibold">MATERIAL NAME</th>
                                    <th className="p-3 font-semibold">TYPE</th>
                                    <th className="p-3 font-semibold">QUANTITY</th>
                                    <th className="p-3 font-semibold">TOTAL COST WITH GST</th>
                                    <th className="p-3 font-semibold">APPROVAL / REJECT</th>
                                    <th className="p-3 font-semibold">REMARKS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {request.items.map((item, index) => {
                                    const itemState = itemStates[request.id]?.[item.id] || {};
                                    return (
                                        <tr key={item.id} className="border-b">
                                            <td className="p-3">{index + 1}</td>
                                            <td className="p-3">{item.name}</td>
                                            <td className="p-3">{item.type}</td>
                                            <td className="p-3">{item.quantity}</td>
                                            <td className="p-3">₹{item.cost}</td>
                                            <td className="p-3">
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleStatusChange(request.id, item.id, 'approved')} className={`p-1 w-7 h-7 flex items-center justify-center rounded-full ${itemState.status === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>✓</button>
                                                    <button onClick={() => handleStatusChange(request.id, item.id, 'rejected')} className={`p-1 w-7 h-7 flex items-center justify-center rounded-full ${itemState.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}>✗</button>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                {itemState.status === 'rejected' && (
                                                    <input 
                                                        type="text" 
                                                        className="w-full p-2 border border-gray-300 rounded-md" 
                                                        value={itemState.remarks || ''}
                                                        onChange={(e) => handleRemarkChange(request.id, item.id, e.target.value)}
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="flex justify-end mt-6">
                            <button onClick={() => handleSubmitApprovals(request.id)} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                                Confirm approval
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

function ConsumerRequestTab() {
    const [requests, setRequests] = useState([]);
    const [users, setUsers] = useState({});
    const [itemStates, setItemStates] = useState({});

    useEffect(() => {
        const usersUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
            const usersMap = {};
            snapshot.forEach(doc => {
                usersMap[doc.id] = doc.data();
            });
            setUsers(usersMap);
        });

        const q = query(collection(db, "distribution_requests"), where("status", "==", "pending"));
        const requestsUnsubscribe = onSnapshot(q, (querySnapshot) => {
            const requestsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRequests(requestsData);
        });
        
        return () => {
            usersUnsubscribe();
            requestsUnsubscribe();
        };
    }, []);

    const handleStatusChange = (requestId, itemName, status) => {
        setItemStates(prev => ({
            ...prev,
            [requestId]: {
                ...prev[requestId],
                [itemName]: { ...prev[requestId]?.[itemName], status }
            }
        }));
    };

    const handleRemarkChange = (requestId, itemName, remarks) => {
        setItemStates(prev => ({
            ...prev,
            [requestId]: {
                ...prev[requestId],
                [itemName]: { ...prev[requestId]?.[itemName], remarks }
            }
        }));
    };

    const handleSubmitApprovals = async (requestId) => {
        const requestDocRef = doc(db, "distribution_requests", requestId);
        const currentRequestState = itemStates[requestId] || {};

        try {
            await runTransaction(db, async (transaction) => {
                const requestDoc = await transaction.get(requestDocRef);
                if (!requestDoc.exists()) {
                    throw new Error("Document does not exist!");
                }

                const originalItems = requestDoc.data().items;
                let allApproved = true;
                let anyApproved = false;

                const updatedItems = originalItems.map(item => {
                    const itemState = currentRequestState[item.name];
                    if (itemState && (itemState.status === 'approved' || itemState.status === 'rejected')) {
                        if (itemState.status !== 'approved') allApproved = false;
                        if (itemState.status === 'approved') anyApproved = true;
                        return { ...item, status: itemState.status, remarks: itemState.remarks || '' };
                    }
                    allApproved = false; // An item was left pending
                    return item;
                });
                
                const finalStatus = allApproved ? 'approved' : anyApproved ? 'partially-approved' : 'rejected';

                transaction.update(requestDocRef, { items: updatedItems, status: finalStatus });
            });
            alert("Approvals submitted successfully!");
        } catch (error) {
            console.error("Error submitting approvals: ", error);
            alert("Failed to submit approvals. Please try again.");
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate();
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

   return (
        <div className="space-y-6">
            {requests.length === 0 ? (
                <p className="text-gray-500 text-center mt-8">No pending requests from Consumers.</p>
            ) : (
                requests.map(request => {
                    const consumerInfo = users[request.consumerId] || {};
                    return (
                        <div key={request.id} className="bg-white p-6 rounded-lg shadow-md">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Consumer Name</label>
                                    <p className="font-semibold">{consumerInfo.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Designation</label>
                                    <p className="font-semibold">{consumerInfo.designation || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Date</label>
                                    <p className="font-semibold">{formatDate(request.submittedAt)}</p>
                                </div>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-3 font-semibold">SL.NO</th>
                                        <th className="p-3 font-semibold">MATERIAL</th>
                                        <th className="p-3 font-semibold">TYPE</th>
                                        <th className="p-3 font-semibold">QUANTITY</th>
                                        <th className="p-3 font-semibold">APPROVE / REJECT</th>
                                        <th className="p-3 font-semibold">REMARKS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {request.items.map((item, index) => {
                                        const itemState = itemStates[request.id]?.[item.name] || {};
                                        return (
                                            <tr key={index} className="border-b">
                                                <td className="p-3">{index + 1}</td>
                                                <td className="p-3">{item.name}</td>
                                                <td className="p-3">{item.type || 'N/A'}</td>
                                                <td className="p-3">{item.requiredQuantity}</td>
                                                <td className="p-3">
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleStatusChange(request.id, item.name, 'approved')} className={`p-1 w-7 h-7 flex items-center justify-center rounded-full ${itemState.status === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>✓</button>
                                                        <button onClick={() => handleStatusChange(request.id, item.name, 'rejected')} className={`p-1 w-7 h-7 flex items-center justify-center rounded-full ${itemState.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}>✗</button>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    {itemState.status === 'rejected' && (
                                                        <input 
                                                            type="text" 
                                                            placeholder="Add remarks..."
                                                            className="w-full p-2 border border-gray-300 rounded-md" 
                                                            value={itemState.remarks || ''}
                                                            onChange={(e) => handleRemarkChange(request.id, item.name, e.target.value)}
                                                        />
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div className="flex justify-end mt-6">
                                <button onClick={() => handleSubmitApprovals(request.id)} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                                    Confirm Approval
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}

// --- Confirmation Modal Component ---
function ConfirmationModal({ onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-sm">
                <h2 className="text-xl font-bold mb-4 text-center">Confirm Submission</h2>
                <p className="text-center text-gray-600 mb-6">Are you sure you want to submit this request? Once submitted, you cannot edit or delete the items.</p>
                <div className="flex justify-center gap-4">
                    <button onClick={onCancel} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button onClick={onConfirm} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Confirm</button>
                </div>
            </div>
        </div>
    );
}


// --- Consumer Dashboard ---
function ConsumerDashboard({ user, onLogout }) {
    const [approvedStock, setApprovedStock] = useState([]);
    const [distributedStock, setDistributedStock] = useState([]);
    const [availableItems, setAvailableItems] = useState([]);
    const [approvalRequests, setApprovalRequests] = useState({});
    
    // Form state
    const [selectedMaterial, setSelectedMaterial] = useState('');
    const [requiredQuantity, setRequiredQuantity] = useState('');
    const [editingRequestId, setEditingRequestId] = useState(null);

    // List states
    const [localPendingRequests, setLocalPendingRequests] = useState([]);
    const [submittedRequests, setSubmittedRequests] = useState([]);

    // UI state
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    
    // Helper to format Firestore Timestamp to DD/MM/YYYY
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate();
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatBillDate = (dateString) => {
        if (!dateString) return 'N/A';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    // Listener for all approval requests to get the bill date
    useEffect(() => {
        const q = query(collection(db, "approval_requests"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requests = {};
            snapshot.forEach(doc => {
                doc.data().items.forEach(item => {
                    if (item.serialNumber) {
                        requests[item.serialNumber] = doc.data().billDate;
                    }
                });
            });
            setApprovalRequests(requests);
        });
        return unsubscribe;
    }, []);

    // Listener for approved items from caseworkers
    useEffect(() => {
        const q = query(collection(db, "approval_requests"), where("status", "in", ["approved", "partially-approved"]));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const itemMap = new Map();
            snapshot.forEach(doc => {
                doc.data().items.forEach(item => {
                    if (item.status === 'approved') {
                        const quantity = parseInt(item.quantity, 10);
                        if (itemMap.has(item.name)) {
                            const existing = itemMap.get(item.name);
                            existing.quantity += quantity;
                        } else {
                            itemMap.set(item.name, { ...item, quantity });
                        }
                    }
                });
            });
            setApprovedStock(Array.from(itemMap.values()));
        });
        return unsubscribe;
    }, []);

    // Listener for all distribution requests to calculate total distributed stock
    useEffect(() => {
        const q = query(collection(db, "distribution_requests"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const itemMap = new Map();
            snapshot.forEach(doc => {
                // We count pending, approved, and collected towards distributed stock
                if (doc.data().status !== 'rejected') {
                    doc.data().items.forEach(item => {
                        const quantity = parseInt(item.requiredQuantity, 10) || 0;
                        if (itemMap.has(item.name)) {
                            const existing = itemMap.get(item.name);
                            existing.quantity += quantity;
                        } else {
                            itemMap.set(item.name, { name: item.name, quantity });
                        }
                    });
                }
            });
            setDistributedStock(Array.from(itemMap.values()));
        });
        return unsubscribe;
    }, []);
    
    // Listener for the current user's distribution requests to manage UI state and lists
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "distribution_requests"), where("consumerId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSubmittedRequests(requests);
            const hasPending = requests.some(req => req.status === 'pending');
            setIsSubmitted(hasPending);
        });
        return unsubscribe;
    }, [user]);
    
    // Listener for the user's local pending requests (before submission)
    useEffect(() => {
        if (!user) return;
        // If there's already a submitted request, we don't need to listen to the local one.
        if (isSubmitted) {
            setLocalPendingRequests([]);
            return;
        }
        const q = query(collection(db, `users/${user.uid}/pending_requests`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLocalPendingRequests(requests);
        });
        return unsubscribe;
    }, [user, isSubmitted]);


    // Recalculates the net available stock
    useEffect(() => {
        const netStockMap = new Map();
        approvedStock.forEach(item => {
            netStockMap.set(item.name, { ...item });
        });
        distributedStock.forEach(item => {
            if (netStockMap.has(item.name)) {
                netStockMap.get(item.name).quantity -= item.quantity;
            }
        });
        
        const finalStock = Array.from(netStockMap.values()).filter(item => item.quantity > 0);
        setAvailableItems(finalStock);
    }, [approvedStock, distributedStock]);

    const handleAddOrUpdateItem = async () => {
        if (!selectedMaterial || !requiredQuantity || parseInt(requiredQuantity, 10) <= 0) {
            alert("Please select a material and enter a valid quantity.");
            return;
        }

        const availableItem = availableItems.find(item => item.name === selectedMaterial);
        const pendingQty = localPendingRequests
            .filter(req => req.name === selectedMaterial && req.id !== editingRequestId)
            .reduce((sum, req) => sum + parseInt(req.requiredQuantity, 10), 0);
            
        const currentAvailable = (availableItem ? availableItem.quantity : 0) - pendingQty;
        
        if (parseInt(requiredQuantity, 10) > currentAvailable) {
             alert(`Required quantity (${requiredQuantity}) cannot be more than the available quantity of ${currentAvailable}.`);
            return;
        }

        const requestData = {
            name: selectedMaterial,
            requiredQuantity,
            status: 'Pending',
            type: availableItem.type,
            info: availableItem.info,
            serialNumber: availableItem.serialNumber || '',
            modelNumber: availableItem.modelNumber || ''
        };

        try {
            if (editingRequestId) {
                const docRef = doc(db, `users/${user.uid}/pending_requests`, editingRequestId);
                await updateDoc(docRef, requestData);
            } else {
                 await addDoc(collection(db, `users/${user.uid}/pending_requests`), requestData);
            }
        } catch (error) {
            console.error("Error saving pending request:", error);
            alert("Could not save the item. Please try again.");
        }

        setSelectedMaterial('');
        setRequiredQuantity('');
        setEditingRequestId(null);
    };
    
    const handleEditRequest = (requestToEdit) => {
        setEditingRequestId(requestToEdit.id);
        setSelectedMaterial(requestToEdit.name);
        setRequiredQuantity(requestToEdit.requiredQuantity);
    };

    const handleDeleteRequest = async (id) => {
        try {
            await deleteDoc(doc(db, `users/${user.uid}/pending_requests`, id));
        } catch (error) {
            console.error("Error deleting pending request:", error);
            alert("Could not delete the item. Please try again.");
        }
    };

    const handleFinalSubmit = async () => {
        if (localPendingRequests.length === 0) {
            alert("Please add at least one item to the list before submitting.");
            return;
        }
        setShowConfirmModal(true);
    };

    const confirmSubmit = async () => {
        try {
            await addDoc(collection(db, 'distribution_requests'), {
                consumerId: user.uid,
                consumerEmail: user.email,
                items: localPendingRequests.map(({id, ...rest}) => rest),
                status: 'pending',
                submittedAt: serverTimestamp(),
            });

            const q = query(collection(db, `users/${user.uid}/pending_requests`));
            const querySnapshot = await getDocs(q);
            const deletePromises = [];
            querySnapshot.forEach((doc) => {
                deletePromises.push(deleteDoc(doc.ref));
            });
            await Promise.all(deletePromises);

            alert("Distribution request sent for approval!");
            setShowConfirmModal(false);
        } catch (error) {
            console.error("Error sending distribution request: ", error);
            alert("Failed to send request. Please try again.");
            setShowConfirmModal(false);
        }
    };

    const currentItem = availableItems.find(item => item.name === selectedMaterial);
    const pendingQtyForCurrent = localPendingRequests
        .filter(req => req.name === selectedMaterial && req.id !== editingRequestId)
        .reduce((sum, req) => sum + parseInt(req.requiredQuantity, 10), 0);
    const displayQty = (currentItem?.quantity || 0) - pendingQtyForCurrent;

    const dropdownItems = availableItems.filter(item => 
        !localPendingRequests.some(req => req.name === item.name) || (editingRequestId && selectedMaterial === item.name)
    );

    const pendingListForDisplay = isSubmitted 
        ? submittedRequests.find(req => req.status === 'pending')?.items || [] 
        : localPendingRequests;

    const recordListForDisplay = submittedRequests
        .filter(req => req.status !== 'pending')
        .flatMap(req =>
            req.items.map(item => ({
                ...item,
                requestId: req.id,
                requestStatus: req.status,
                dateOfPurchase: approvalRequests[item.serialNumber] || null
            }))
        )
        .filter(item => item.status !== 'pending');

    const nonReturnableRecords = recordListForDisplay.filter(item => item.type !== 'Returnable');
    const returnableRecords = recordListForDisplay.filter(item => item.type === 'Returnable');

    const renderRecordRow = (item, index, isReturnable) => {
        let statusText = 'N/A';
        let remarksText = item.remarks || '---';

        switch(item.status) {
            case 'collected':
                statusText = 'Collected';
                remarksText = '---';
                break;
            case 'approved':
                statusText = 'Approved';
                remarksText = 'Ready for collection';
                break;
            case 'rejected':
                statusText = 'Rejected';
                break;
            default:
                statusText = item.status;
        }

        return (
            <tr key={`${item.requestId}-${index}`} className="border-b">
                <td className="p-3">{index + 1}</td>
                <td className="p-3">{item.name}</td>
                {isReturnable && <td className="p-3">{item.serialNumber || 'N/A'}</td>}
                {isReturnable && <td className="p-3">{item.modelNumber || 'N/A'}</td>}
                {isReturnable && <td className="p-3">{formatBillDate(item.dateOfPurchase)}</td>}
                <td className="p-3">{formatDate(item.dateTaken)}</td>
                <td className="p-3">{item.requiredQuantity}</td>
                <td className="p-3">{statusText}</td>
                <td className="p-3">{remarksText}</td>
                {isReturnable && <td className="p-3">---</td>}
            </tr>
        );
    };

    return (
        <div className="flex flex-col h-screen p-4 md:p-8">
            {showConfirmModal && <ConfirmationModal onConfirm={confirmSubmit} onCancel={() => setShowConfirmModal(false)} />}
            <header className="flex-shrink-0 flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Consumer Portal</h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-600">{user.email}</span>
                    <SettingsButton user={user} onLogout={onLogout} />
                </div>
            </header>
            <main className="flex-grow grid grid-cols-2 gap-8 overflow-y-auto">
                <div className="flex flex-col gap-8">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-4">Request Materials</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                                <select value={selectedMaterial} onChange={e => setSelectedMaterial(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" disabled={isSubmitted}>
                                    <option value="">Select Material</option>
                                    {dropdownItems.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Available</label>
                                <input type="text" readOnly value={displayQty} className="w-full p-2 bg-gray-100 border border-gray-300 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Required Quantity</label>
                                <input type="number" value={requiredQuantity} onChange={e => setRequiredQuantity(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" min="1" disabled={isSubmitted} />
                            </div>
                        </div>
                         <div className="mt-4 flex justify-end gap-4">
                            <button onClick={handleAddOrUpdateItem} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" disabled={isSubmitted}>
                                {editingRequestId ? 'Update Item' : 'Add More'}
                            </button>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md flex-grow flex flex-col">
                        <h2 className="text-2xl font-semibold mb-4">Pending Lists</h2>
                        <div className="flex-grow overflow-y-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="p-3">Sl.No</th>
                                        <th className="p-3">Material</th>
                                        <th className="p-3">Required Quantity</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingListForDisplay.map((req, index) => (
                                        <tr key={req.id || index} className="border-b">
                                            <td className="p-3">{index + 1}</td>
                                            <td className="p-3">{req.name}</td>
                                            <td className="p-3">{req.requiredQuantity}</td>
                                            <td className="p-3 capitalize">{isSubmitted ? 'Pending Approval' : req.status}</td>
                                            <td className="p-3">
                                                {!isSubmitted && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleEditRequest(req)} className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200">Edit</button>
                                                        <button onClick={() => handleDeleteRequest(req.id)} className="text-sm px-2 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200">Delete</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {pendingListForDisplay.length === 0 && <tr><td colSpan="5" className="text-center p-8 text-gray-500">No items in pending list.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                         <div className="mt-4 flex justify-end">
                             <button onClick={handleFinalSubmit} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700" disabled={localPendingRequests.length === 0 || isSubmitted}>
                                Send for Approval
                            </button>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex flex-col">
                    <h2 className="text-2xl font-semibold mb-4">Record Table</h2>
                    <div className="flex-grow overflow-y-auto space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold mb-3">Non-Returnable</h3>
                            <table className="w-full text-left">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-3 text-sm font-semibold">SL. NO</th>
                                        <th className="p-3 text-sm font-semibold">MATERIAL</th>
                                        <th className="p-3 text-sm font-semibold">DATE TAKEN</th>
                                        <th className="p-3 text-sm font-semibold">QUANTITY</th>
                                        <th className="p-3 text-sm font-semibold">STATUS</th>
                                        <th className="p-3 text-sm font-semibold">REMARKS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {nonReturnableRecords.length > 0 ? (
                                        nonReturnableRecords.map((item, index) => renderRecordRow(item, index, false))
                                    ) : (
                                        <tr><td colSpan="6" className="text-center p-8 text-gray-500">No non-returnable records found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold mb-3">Returnable</h3>
                            <table className="w-full text-left">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-3 text-sm font-semibold">SL. NO</th>
                                        <th className="p-3 text-sm font-semibold">MATERIAL</th>
                                        <th className="p-3 text-sm font-semibold">SERIAL NO</th>
                                        <th className="p-3 text-sm font-semibold">MODEL NO</th>
                                        <th className="p-3 text-sm font-semibold">DATE OF PURCHASE</th>
                                        <th className="p-3 text-sm font-semibold">DATE TAKEN</th>
                                        <th className="p-3 text-sm font-semibold">QUANTITY</th>
                                        <th className="p-3 text-sm font-semibold">STATUS</th>
                                        <th className="p-3 text-sm font-semibold">REMARKS</th>
                                        <th className="p-3 text-sm font-semibold">DATE OF RETURN</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {returnableRecords.length > 0 ? (
                                        returnableRecords.map((item, index) => renderRecordRow(item, index, true))
                                    ) : (
                                        <tr><td colSpan="10" className="text-center p-8 text-gray-500">No returnable records found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}