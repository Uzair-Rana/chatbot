import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function App() {
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content:
                "👋 Hello! I'm your Health Assistant 🩺\nHow can I help you feel better today?",
            timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        },
    ]);
    const [input, setInput] = useState("");
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, doctors]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = {
            role: "user",
            content: input,
            timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };
        setMessages((prev) => [...prev, userMsg]);
        setDoctors([]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("http://127.0.0.1:8000/api/message/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input }),
            });
            const data = await res.json();

            const botMsg = {
                role: "assistant",
                content: data.reply || "No reply received.",
                timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };
            setMessages((prev) => [...prev, botMsg]);

            if (Array.isArray(data.doctors) && data.doctors.length > 0) {
                setDoctors(data.doctors);
            }
        } catch (error) {
            console.error("Error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        "⚠️ Could not connect to the backend. Please check your connection.",
                    timestamp: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 text-gray-800 font-sans">
            {/* 🌈 Header */}
            <header className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md border-b border-teal-400/50">
                <div className="h-20 flex flex-col justify-center items-center text-center">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-wide drop-shadow-sm">
                        🩺 ChatAI Health Assistant
                    </h1>
                    <p className="text-sm opacity-90">
                        Your trusted AI health companion 🌿
                    </p>
                </div>
            </header>

            {/* 💬 Chat Area */}
            <main className="flex-1 overflow-y-auto px-5 py-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-400/40 scrollbar-track-gray-100/50">
                <AnimatePresence>
                    {messages.map((msg, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`flex ${
                                msg.role === "user" ? "justify-end" : "justify-start"
                            }`}
                        >
                            <div
                                className={`relative max-w-xs md:max-w-md p-4 rounded-2xl shadow-md ${
                                    msg.role === "user"
                                        ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-br-none"
                                        : "bg-white/70 backdrop-blur-lg border border-gray-300 rounded-bl-none text-gray-800"
                                }`}
                            >
                                <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.9 }}
                                    transition={{ delay: 0.3 }}
                                    className={`absolute text-[11px] px-3 py-[2px] rounded-full bottom-[-12px] ${
                                        msg.role === "user"
                                            ? "right-3 bg-white/20 text-gray-100"
                                            : "left-3 bg-gray-200 text-gray-700"
                                    }`}
                                >
                                    {msg.timestamp}
                                </motion.span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Typing Indicator */}
                {loading && (
                    <div className="flex justify-start">
                        <div className="flex items-center gap-2 bg-white/80 border border-teal-300 px-4 py-2 rounded-2xl shadow-md text-teal-700 animate-pulse">
                            <span className="animate-bounce text-teal-500">💭</span>
                            Thinking...
                        </div>
                    </div>
                )}

                {/* 🩺 Doctor Cards */}
                {doctors.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6"
                    >
                        {doctors.map((doc) => (
                            <motion.div
                                key={doc.id}
                                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.4, type: "spring", stiffness: 80 }}
                                whileHover={{
                                    scale: 1.05,
                                    y: -5,
                                    boxShadow: "0 10px 25px rgba(13, 148, 136, 0.2)",
                                }}
                                className="bg-white shadow-lg rounded-2xl border border-teal-200 p-5 flex flex-col justify-between hover:border-cyan-300 transition-all duration-300"
                            >
                                <div>
                                    <h3 className="text-xl font-bold text-teal-700 mb-1">
                                        {doc.name}
                                    </h3>
                                    <p className="text-sm text-teal-600 mb-2">
                                        {doc.specialization || "Health Specialist"}
                                    </p>
                                    <p className="text-sm">
                                        <strong>📍 Address:</strong> {doc.address || "—"}
                                    </p>
                                    <p className="text-sm">
                                        <strong>📞 Phone:</strong>{" "}
                                        <span className="font-semibold text-cyan-600">
                      {doc.phone || "—"}
                    </span>
                                    </p>
                                </div>
                                <div className="mt-3">
                                    <p className="font-semibold text-sm text-gray-700 mb-1">
                                        ⏰ Timings:
                                    </p>
                                    <ul className="list-disc list-inside text-sm text-gray-600">
                                        {(doc.timings || ["Mon–Fri: 9 AM – 5 PM"]).map((t, i) => (
                                            <li key={i}>{t}</li>
                                        ))}
                                    </ul>
                                </div>
                                <motion.button
                                    whileHover={{
                                        backgroundColor: "#0D9488",
                                        color: "#fff",
                                        scale: 1.03,
                                    }}
                                    className="mt-4 w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold py-2 rounded-xl shadow hover:shadow-lg transition-all"
                                >
                                    📅 Book Appointment
                                </motion.button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
                <div ref={chatEndRef} />
            </main>

            {/* ✍️ Input Bar */}
            <form
                onSubmit={sendMessage}
                className="sticky bottom-5 flex items-center gap-3 w-11/12 md:w-2/3 mx-auto p-3 bg-white/80 backdrop-blur-lg border border-gray-300 rounded-full shadow-lg"
            >
                <input
                    type="text"
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-grow bg-transparent outline-none text-gray-800 placeholder-gray-500 px-4"
                />
                <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-full hover:shadow-md transition-all"
                >
                    Send 🚀
                </button>
            </form>
        </div>
    );
}
