import React, { Fragment, useEffect, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";

export default function AIPromptModal({ isOpen, onClose, onSubmit }) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
    } else {
      setValue("");
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    const text = (value || "").trim();
    onSubmit?.(text || "star");
  };

  return (
    <Transition appear show={!!isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100000]" onClose={() => onClose?.()}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-2 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 p-6 text-left align-middle shadow-2xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-white">
                  Describe your AI Component
                </Dialog.Title>
                <div className="mt-2 text-sm text-gray-300">
                  Tell the AI what to generate (e.g. "star", "make a circle", "modern card with title and button").
                </div>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <textarea
                    ref={inputRef}
                    rows={3}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full rounded-xl border border-gray-700 bg-gray-800/70 p-3 text-sm text-white placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="e.g. neon gradient star icon"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onClose?.()}
                      className="px-4 py-2 text-sm rounded-lg bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700/80"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white hover:from-indigo-400 hover:to-fuchsia-400"
                    >
                      Generate
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}


