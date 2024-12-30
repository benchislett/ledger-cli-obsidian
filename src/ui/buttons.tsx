import React from 'react';

const Button: React.FC<{
    selected: boolean;
    action?: () => void;
    children?: React.ReactNode;
}> = (props): React.JSX.Element => {
    const className = ["px-4 py-2 rounded-md shadow", props.selected ? 'mod-cta' : null]
        .filter((n) => n)
        .join(' ');
    return (
        <button className={className} onClick={props.action}>
            {props.children}
        </button>
    );
};

const MultiButton: React.FC<{
    options: string[];
    selectedOption: string;
    onSelect: (option: string) => void;
}> = ({ options, selectedOption, onSelect }) => {
    return (
        <div className="inline-flex rounded-md shadow border" role="group">
            {options.map((option, index) => (
                <React.Fragment key={option}>
                    <button type="button" onClick={() => onSelect(option)} className={`px-4 py-2 ${(index === 0) ? "rounded-r-none" : (index === options.length - 1) ? "rounded-l-none" : "rounded-none"} transition duration-300 ease-in-out ${(option === selectedOption) ? "mod-cta" : ""}`} style={{ boxShadow: "none" }}>
                        {option}
                    </button>
                    {index < options.length - 1 && <div className="w-px bg-gray-300"></div>}
                </React.Fragment>
            ))}
        </div>
    );
};

export { Button, MultiButton }