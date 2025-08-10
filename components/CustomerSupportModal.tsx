import React, { useState } from 'react';
import { CloseIcon } from './icons';

interface CustomerSupportModalProps {
    onClose: () => void;
}

const ContactRow: React.FC<{ label: string; value: string; copyText: string; isCopied: boolean; onCopy: () => void; }> = ({ label, value, copyText, isCopied, onCopy }) => (
  <div className="flex justify-between items-center py-2">
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-semibold text-slate-800">{value}</p>
    </div>
    <button onClick={onCopy} className="text-sm text-blue-600 hover:underline font-semibold transition-colors flex-shrink-0 ml-4 px-3 py-1 rounded-md hover:bg-blue-100">
      {isCopied ? '복사됨!' : '복사하기'}
    </button>
  </div>
);


const CustomerSupportModal: React.FC<CustomerSupportModalProps> = ({ onClose }) => {
    const [copiedItem, setCopiedItem] = useState<string | null>(null);

    const handleCopy = (text: string, identifier: string) => {
        navigator.clipboard.writeText(text).then(() => {
        setCopiedItem(identifier);
        setTimeout(() => setCopiedItem(null), 2000); // Reset after 2 seconds
        });
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md flex flex-col shadow-xl animate-scale-up">
                <header className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                    <h2 className="text-lg font-bold text-slate-800">고객센터</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors" aria-label="닫기">
                        <CloseIcon />
                    </button>
                </header>
                <main className="p-5">
                     <div className="space-y-2">
                        <ContactRow 
                            label="Phone 1" 
                            value="02-573-7790 비주얼캠프" 
                            copyText="02-573-7790" 
                            isCopied={copiedItem === 'phone1'} 
                            onCopy={() => handleCopy('02-573-7790', 'phone1')} 
                        />
                        <ContactRow 
                            label="Phone 2" 
                            value="010-4983-2687 윤현수 팀장" 
                            copyText="010-4983-2687" 
                            isCopied={copiedItem === 'phone2'} 
                            onCopy={() => handleCopy('010-4983-2687', 'phone2')} 
                        />
                        <ContactRow 
                            label="Email" 
                            value="readforschool@visual.camp" 
                            copyText="readforschool@visual.camp" 
                            isCopied={copiedItem === 'email'} 
                            onCopy={() => handleCopy('readforschool@visual.camp', 'email')} 
                        />
                    </div>
                </main>
                <footer className="p-4 border-t border-gray-200 flex-shrink-0 flex justify-end">
                    <button onClick={onClose} className="bg-blue-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-blue-700 transition-colors">
                        확인
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default CustomerSupportModal;