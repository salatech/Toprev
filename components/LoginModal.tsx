"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const { signInWithGoogle } = useAuth();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4"
                    >
                        <div className="relative overflow-hidden rounded-xl border border-amber-900/50 bg-zinc-950 p-6 shadow-2xl shadow-amber-900/20">
                            {/* Decorative gradient */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300"
                            >
                                <X className="w-4 h-4" />
                            </Button>

                            <div className="flex flex-col items-center text-center space-y-4 pt-4">
                                <div className="h-12 w-12 rounded-full bg-amber-900/20 flex items-center justify-center text-amber-500 ring-1 ring-amber-500/50">
                                    <Lock className="w-6 h-6" />
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-xl font-bold text-zinc-100">
                                        Free limit reached
                                    </h2>
                                    <p className="text-sm text-zinc-400 max-w-[280px]">
                                        You've used your 3 free roasts. Sign in to unlock unlimited access and cloud history.
                                    </p>
                                </div>

                                <div className="w-full pt-4 space-y-3">
                                    <Button
                                        onClick={() => {
                                            signInWithGoogle();
                                            onClose();
                                        }}
                                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold h-11"
                                    >
                                        Sign In with Google
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={onClose}
                                        className="w-full text-zinc-500 hover:text-zinc-300"
                                    >
                                        Maybe later
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
