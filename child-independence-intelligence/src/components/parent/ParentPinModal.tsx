import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, X, KeyRound, AlertTriangle } from 'lucide-react';
import { ParentAuthService } from '../../auth/ParentAuthService';

interface ParentPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  childName?: string;
}

export const ParentPinModal: React.FC<ParentPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  childName = 'Aarav',
}) => {
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lockoutSec, setLockoutSec] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMessage(null);
      checkLockout();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: any = null;
    if (lockoutSec > 0) {
      timer = setInterval(() => {
        setLockoutSec((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setErrorMessage(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutSec]);

  const checkLockout = () => {
    const remaining = ParentAuthService.getLockoutRemainingSeconds();
    if (remaining > 0) {
      setLockoutSec(remaining);
      setErrorMessage(`Security lockout active. Try again in ${remaining}s.`);
      return true;
    }
    return false;
  };

  const handleVerify = async (candidatePin: string) => {
    if (checkLockout()) return;
    if (candidatePin.length < 4) return;

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const result = await ParentAuthService.authenticate(candidatePin);

      if (result.success) {
        setPin('');
        setIsVerifying(false);
        onSuccess();
      } else {
        setIsVerifying(false);
        setPin('');
        if (result.isLockedOut && result.lockoutRemainingSeconds) {
          setLockoutSec(result.lockoutRemainingSeconds);
          setErrorMessage(`Too many attempts. Locked out for ${result.lockoutRemainingSeconds}s.`);
        } else {
          setErrorMessage(
            result.remainingAttempts !== undefined
              ? `Incorrect PIN. ${result.remainingAttempts} attempts remaining.`
              : 'Incorrect PIN. Please try again.'
          );
        }
        inputRef.current?.focus();
      }
    } catch (e) {
      setIsVerifying(false);
      setErrorMessage('Verification failed. Please try again.');
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleVerify(pin);
  };

  const handleKeypadPress = (num: string) => {
    if (lockoutSec > 0 || isVerifying) return;
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMessage(null);
      if (nextPin.length === 4) {
        handleVerify(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (lockoutSec > 0 || isVerifying) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-100 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close PIN modal"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xs">
          {lockoutSec > 0 ? (
            <AlertTriangle className="w-7 h-7 text-amber-600 animate-pulse" />
          ) : (
            <Lock className="w-7 h-7 text-indigo-600" />
          )}
        </div>

        <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1">
          Parent Dashboard Access
        </h3>
        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          Secured by domain security subsystem with salted PBKDF2 hashing and rate-limiting.
        </p>

        {/* 4 Pin Indicator Dots */}
        <div className="flex justify-center gap-3 mb-4">
          {[0, 1, 2, 3].map((idx) => {
            const hasValue = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center text-xl font-bold transition-all duration-150 ${
                  errorMessage
                    ? 'border-rose-400 bg-rose-50 text-rose-600'
                    : hasValue
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-transparent'
                }`}
              >
                {hasValue ? '•' : ''}
              </div>
            );
          })}
        </div>

        {/* Hidden input for direct typing / accessibility */}
        <form onSubmit={handleSubmit} className="mb-2">
          <input
            ref={inputRef}
            type="password"
            maxLength={4}
            disabled={lockoutSec > 0 || isVerifying}
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
              setPin(val);
              setErrorMessage(null);
              if (val.length === 4) {
                handleVerify(val);
              }
            }}
            className="sr-only"
            autoFocus
          />
        </form>

        {errorMessage && (
          <p className="text-xs text-rose-600 font-semibold mb-3 animate-fadeIn px-2">
            {errorMessage}
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={lockoutSec > 0 || isVerifying}
              onClick={() => handleKeypadPress(digit)}
              className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 text-slate-800 font-bold text-base border border-slate-200/80 active:scale-95 transition-all cursor-pointer"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            disabled={lockoutSec > 0 || isVerifying}
            onClick={() => setPin('')}
            className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-400 text-xs font-semibold border border-slate-200/80 cursor-pointer active:scale-95"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={lockoutSec > 0 || isVerifying}
            onClick={() => handleKeypadPress('0')}
            className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-800 font-bold text-base border border-slate-200/80 active:scale-95 transition-all cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            disabled={lockoutSec > 0 || isVerifying}
            onClick={handleDelete}
            className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-600 text-xs font-semibold border border-slate-200/80 cursor-pointer active:scale-95"
          >
            ⌫
          </button>
        </div>

        {/* Default PIN Helper Badge */}
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl py-1.5 px-3 mb-3 text-[11px] text-indigo-700 flex items-center justify-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5 shrink-0" />
          <span>Default Parent PIN: <strong className="font-mono font-bold text-indigo-900">2026</strong></span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer transition-colors"
        >
          Cancel and return to {childName}'s Space
        </button>
      </div>
    </div>
  );
};
