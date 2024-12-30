import React, { useState } from 'react';
import { Settings } from 'lucide-react';

interface SettingsOption {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

interface SettingsButtonProps {
  options: Record<string, SettingsOption>;
  buttonClassName?: string;
  dropdownClassName?: string;
}

const SettingsButton: React.FC<SettingsButtonProps> = ({
  options,
  buttonClassName = "",
  dropdownClassName = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors ${buttonClassName}`}
      >
        <Settings className="w-6 h-6" />
      </button>
      
      {isOpen && (
        <div 
          className={`absolute right-0 top-full mt-2 w-fit min-w-[12rem] bg-white rounded-lg shadow-lg border border-gray-200 z-50 ${dropdownClassName}`}
        >
          {Object.entries(options).map(([key, option]) => (
            <div
              key={key}
              onClick={() => option.onChange(!option.enabled)}
              className="flex items-center p-3 hover:bg-gray-50 cursor-pointer whitespace-nowrap"
            >
              <input
                type="checkbox"
                checked={option.enabled}
                readOnly
                className="w-4 h-4 flex-shrink-0 mr-3"
              />
              <span className="capitalize">{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { SettingsButton };
export type { SettingsOption, SettingsButtonProps };