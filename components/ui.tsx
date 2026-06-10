"use client";

import {ComboBox as HeroComboBox, Input as HeroInput, ListBox as HeroListBox, Table as HeroTable} from "@heroui/react";
import NextLink from "next/link";
import React, {createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState} from "react";

export type SortDescriptor = {
    column?: React.Key;
    direction?: "ascending" | "descending";
};

const colorClass: Record<string, string> = {
    primary: "bg-primary/15 text-primary",
    secondary: "bg-primary/15 text-primary",
    success: "bg-emerald-500/15 text-emerald-300",
    danger: "bg-red-500/15 text-red-300",
    warning: "bg-amber-500/15 text-amber-300",
    default: "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200",
};

export const useDisclosure = () => {
    const [isOpen, setIsOpen] = useState(false);
    return {
        isOpen,
        onOpen: () => setIsOpen(true),
        onClose: () => setIsOpen(false),
        onOpenChange: (open?: boolean) => setIsOpen((value) => typeof open === "boolean" ? open : !value),
    };
};

type ButtonProps = {
    children?: ReactNode;
    className?: string;
    disabled?: boolean;
    onClick?: React.MouseEventHandler<any>;
    href?: string;
    as?: unknown;
    isExternal?: boolean;
    onPress?: React.MouseEventHandler<any>;
    isIconOnly?: boolean;
    isDisabled?: boolean;
    isLoading?: boolean;
    color?: string;
    variant?: string;
    size?: string;
    radius?: string;
    startContent?: ReactNode;
    endContent?: ReactNode;
    [key: string]: any;
};

export const Button = ({children, href, as, isExternal, onPress, onClick, isIconOnly, isDisabled, isLoading, disabled, className = "", color = "default", variant, size, radius, startContent, endContent, ...props}: ButtonProps) => {
    const isBusy = !!isLoading;
    const isUnavailable = disabled || isDisabled || isBusy;
    const base = isIconOnly
        ? "inline-flex h-9 w-9 items-center justify-center rounded-lg p-0"
        : `inline-flex items-center justify-center gap-2 rounded-xl px-4 ${size === "lg" ? "py-3 text-base" : "py-2 text-sm"}`;
    const tone = color === "primary" || color === "secondary"
        ? "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
        : colorClass[color] || colorClass.default;
    const light = variant === "light" ? "bg-transparent shadow-none hover:bg-white/[0.06]" : "";
    const classes = `${base} font-bold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${isUnavailable ? "pointer-events-none opacity-60" : ""} ${tone} ${light} ${className}`;
    const content = (
        <>
            {isBusy ? <Spinner className="h-4 w-4 border-2"/> : startContent}
            {children}
            {endContent}
        </>
    );

    const handleClick: React.MouseEventHandler<any> = (event) => {
        if (isUnavailable) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        (onPress || onClick)?.(event);
    };

    if (href || as) {
        const sharedProps = {
            ...(props as any),
            className: classes,
            onClick: handleClick,
            "aria-disabled": isUnavailable || undefined,
        };

        if (href && typeof href === "string" && href.startsWith("/") && !isExternal) {
            return (
                <NextLink {...sharedProps} href={href}>
                    {content}
                </NextLink>
            );
        }

        return (
            <a {...sharedProps} href={href} target={isExternal ? "_blank" : props.target} rel={isExternal ? "noreferrer" : props.rel}>
                {content}
            </a>
        );
    }

    return (
        <button {...(props as any)} type={props.type || "button"} disabled={isUnavailable} aria-busy={isBusy || undefined} className={classes} onClick={handleClick}>
            {content}
        </button>
    );
};

export const Link = ({children, href, isExternal, className = "", color, size, underline, showAnchorIcon, anchorIcon, isDisabled, ...props}: any) => {
    if (href && typeof href === "string" && href.startsWith("/") && !isExternal) {
        return (
            <NextLink {...props} href={href} className={className}>
                {children}
            </NextLink>
        );
    }

    return (
        <a {...props} href={href} target={isExternal ? "_blank" : props.target} rel={isExternal ? "noreferrer" : props.rel} aria-disabled={isDisabled || undefined} className={className}>
            {children}
        </a>
    );
};

export const Card = ({children, className = "", onPress, onClick, isExternal, href, as: Component, isPressable, isHoverable, shadow, radius, ...props}: any) => {
    const classes = `relative overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm dark:border-white/10 dark:bg-zinc-900/80 dark:shadow-lg dark:shadow-black/25 dark:text-zinc-100 ${className}`;
    const handleClick = onPress || onClick;

    if (Component) {
        return (
            <Component
                {...props}
                href={href}
                isExternal={isExternal}
                className={classes}
                onClick={handleClick}
            >
                {children}
            </Component>
        );
    }

    if (href) {
        return (
            <a
                {...props}
                href={href}
                target={isExternal ? "_blank" : props.target}
                rel={isExternal ? "noreferrer" : props.rel}
                className={classes}
                onClick={handleClick}
            >
                {children}
            </a>
        );
    }

    return (
        <div
            {...props}
            role={onPress ? "button" : props.role}
            tabIndex={onPress ? 0 : props.tabIndex}
            className={classes}
            onClick={handleClick}
            onKeyDown={(event) => {
                if (onPress && (event.key === "Enter" || event.key === " ")) onPress(event);
            }}
        >
            {children}
        </div>
    );
};
const hasPaddingClass = (className: string) => /\b!?p[trblxy]?-[^\s]+/.test(className);

export const CardHeader = ({children, className = ""}: any) => (
    <div className={`${hasPaddingClass(className) ? "" : "p-4"} ${className}`}>{children}</div>
);
export const CardBody = ({children, className = ""}: any) => (
    <div className={`${hasPaddingClass(className) ? "" : "p-4"} ${className}`}>{children}</div>
);
export const CardFooter = ({children, className = ""}: any) => (
    <div className={`${hasPaddingClass(className) ? "" : "p-4"} ${className}`}>{children}</div>
);
export const Divider = ({className = ""}: any) => <div className={`h-px bg-white/[0.08] ${className}`}/>;

export const Image = ({as: Component, className = "", src, alt = "", radius, removeWrapper, isZoomed, shadow, fallbackSrc, fill, priority, sizes, quality, ...props}: any) => {
    if (Component) {
        return (
            <Component
                {...props}
                src={src}
                alt={alt}
                className={`${radius === "md" ? "rounded-md" : ""} ${className}`}
                fill={fill}
                priority={priority}
                sizes={sizes}
                quality={quality}
            />
        );
    }

    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} src={src} alt={alt} className={`${radius === "md" ? "rounded-md" : ""} ${className}`}/>;
};

const avatarColorClass: Record<string, string> = {
    default: "ring-zinc-300 dark:ring-zinc-600",
    primary: "ring-primary",
    secondary: "ring-secondary",
    success: "ring-success",
    warning: "ring-warning",
    danger: "ring-danger",
};

export const Avatar = ({src, name, className = "", size, isBordered, color = "default", showFallback, fallback, ...props}: any) => {
    const ringClass = isBordered
        ? `ring-3 ring-offset-2 ring-offset-background ${avatarColorClass[color] || avatarColorClass.default}`
        : "";

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            {...props}
            src={src}
            alt={name || ""}
            className={`${size === "sm" ? "h-8 w-8" : "h-10 w-10"} rounded-full object-cover ${className} ${ringClass}`}
        />
    );
};

export const User = ({name, description, avatarProps, className = "", classNames, href, isExternal}: any) => {
    const content = (
        <>
            <Avatar {...avatarProps} name={name}/>
            <div className="min-w-0">
                <div className={`truncate text-sm font-bold text-zinc-900 dark:text-zinc-100 ${classNames?.name || ""}`}>{name}</div>
                {description && <div className={`truncate text-xs text-zinc-500 dark:text-zinc-400 ${classNames?.description || ""}`}>{description}</div>}
            </div>
        </>
    );

    if (href) {
        return (
            <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noreferrer" : undefined}
                className={`flex min-w-0 items-center gap-3 ${className}`}
            >
                {content}
            </a>
        );
    }

    return (
        <div className={`flex min-w-0 items-center gap-3 ${className}`}>
            {content}
        </div>
    );
};

export const Chip = ({children, color = "default", className = "", classNames, startContent, avatar, onClose, style}: any) => (
    <span className={`inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${colorClass[color] || colorClass.default} ${classNames?.base || ""} ${className}`} style={style}>
        {startContent}
        {avatar && <span className="shrink-0 overflow-hidden rounded-full">{avatar}</span>}
        <span className={classNames?.content}>{children}</span>
        {onClose && <button type="button" className={classNames?.closeButton || "ml-1 rounded-full px-1 transition-all duration-150 hover:bg-white/10 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"} onClick={onClose}>×</button>}
    </span>
);

export const Badge = ({children, content, className = "", isInvisible}: any) => (
    <span className={`relative inline-flex ${className}`}>
        {children}
        {content && !isInvisible && <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-[10px] font-bold text-white">{content}</span>}
    </span>
);

const TooltipRoot = ({children, className = ""}: any) => (
    <span className={`group relative inline-flex ${className}`}>{children}</span>
);

const TooltipTrigger = ({children, className = ""}: any) => (
    <span className={`inline-flex ${className}`}>{children}</span>
);

const TooltipContent = ({children, color = "default", className = ""}: any) => (
    <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium shadow-lg group-hover:block group-focus-within:block ${colorClass[color] || colorClass.default} ${className}`}
    >
        {children}
    </span>
);

const TooltipArrow = ({className = ""}: any) => (
    <span className={`absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 rotate-45 bg-inherit ${className}`}/>
);

export const Tooltip = Object.assign(TooltipRoot, {
    Trigger: TooltipTrigger,
    Content: TooltipContent,
    Arrow: TooltipArrow,
});
export const Spinner = ({className = ""}: any) => <span className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}/>;
export const Skeleton = ({className = ""}: any) => <div className={`animate-pulse rounded-lg bg-white/10 ${className}`}/>;

export const Progress = ({value = 0, className = "", classNames}: any) => (
    <div className={`h-2 overflow-hidden rounded-full bg-white/10 ${classNames?.track || ""} ${className}`}>
        <div className={`h-full rounded-full bg-primary transition-[width] ${classNames?.indicator || ""}`} style={{width: `${Math.max(0, Math.min(100, value))}%`}}/>
    </div>
);

export const Alert = ({title, description, color = "default", className = ""}: any) => (
    <div className={`rounded-xl border border-zinc-200 px-4 py-3 text-sm dark:border-white/[0.08] ${colorClass[color] || colorClass.default} ${className}`}>
        {title && <div className="font-bold">{title}</div>}
        {description && <div className="mt-1 text-xs opacity-80">{description}</div>}
    </div>
);

const fieldClass = "min-h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-primary dark:border-white/[0.08] dark:bg-black dark:text-zinc-100 dark:placeholder:text-zinc-600";
type InputProps = {
    label?: ReactNode;
    description?: ReactNode;
    value?: string | number | readonly string[];
    placeholder?: string;
    className?: string;
    type?: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
    onValueChange?: (value: string) => void;
    size?: string;
    variant?: string;
    classNames?: Record<string, string>;
    isRequired?: boolean;
    isInvalid?: boolean;
    errorMessage?: ReactNode;
    labelPlacement?: string;
    [key: string]: any;
};

export const Input = ({label, description, value, onValueChange, onChange, placeholder, className = "", classNames, isRequired, isInvalid, errorMessage, labelPlacement, size, variant, ...props}: InputProps) => (
    <label className={`flex flex-col gap-1 text-sm ${classNames?.base || ""} ${className}`}>
        {label && <span className={`font-bold text-zinc-700 dark:text-zinc-300 ${classNames?.label || ""}`}>{label}</span>}
        <input {...(props as any)} required={isRequired || props.required} value={value} placeholder={placeholder} className={`${fieldClass} ${classNames?.input || ""}`} onChange={(event) => { onValueChange?.(event.target.value); onChange?.(event); }}/>
        {description && <span className={`text-xs text-zinc-500 dark:text-zinc-400 ${classNames?.description || ""}`}>{description}</span>}
        {isInvalid && errorMessage && <span className={`text-xs text-red-400 ${classNames?.errorMessage || ""}`}>{errorMessage}</span>}
    </label>
);
type TextareaProps = {
    label?: ReactNode;
    description?: ReactNode;
    value?: string | number | readonly string[];
    placeholder?: string;
    className?: string;
    onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
    onValueChange?: (value: string) => void;
    isRequired?: boolean;
    isInvalid?: boolean;
    errorMessage?: ReactNode;
    minRows?: number;
    variant?: string;
    labelPlacement?: string;
    [key: string]: any;
};

export const Textarea = ({label, description, value, onValueChange, onChange, placeholder, className = "", classNames, isRequired, isInvalid, errorMessage, minRows, variant, labelPlacement, ...props}: TextareaProps & { classNames?: Record<string, string> }) => (
    <label className={`flex flex-col gap-1 text-sm ${classNames?.base || ""} ${className}`}>
        {label && <span className={`font-bold text-zinc-700 dark:text-zinc-300 ${classNames?.label || ""}`}>{label}</span>}
        <textarea {...(props as any)} required={isRequired || props.required} rows={props.rows || minRows} value={value as any} placeholder={placeholder} className={`${fieldClass} ${classNames?.input || ""}`} onChange={(event) => { onValueChange?.(event.target.value); onChange?.(event); }}/>
        {description && <span className={`text-xs text-zinc-500 dark:text-zinc-400 ${classNames?.description || ""}`}>{description}</span>}
        {isInvalid && errorMessage && <span className={`text-xs text-red-400 ${classNames?.errorMessage || ""}`}>{errorMessage}</span>}
    </label>
);

type SelectProps = {
    children?: ReactNode;
    label?: ReactNode;
    selectedKeys?: Iterable<React.Key>;
    defaultSelectedKeys?: Iterable<React.Key>;
    onSelectionChange?: (keys: Set<string>) => void;
    onChange?: React.ChangeEventHandler<HTMLSelectElement>;
    className?: string;
    placeholder?: string;
    variant?: string;
    selectionMode?: string;
    isRequired?: boolean;
    [key: string]: any;
};

export const Select = ({children, label, selectedKeys, defaultSelectedKeys, onSelectionChange, onChange, className = "", ...props}: SelectProps) => {
    return (
        <SelectImpl
            label={label}
            selectedKeys={selectedKeys}
            defaultSelectedKeys={defaultSelectedKeys}
            onSelectionChange={onSelectionChange}
            onChange={onChange}
            className={className}
            {...props}
        >
            {children}
        </SelectImpl>
    );
};
export const SelectItem = ({children}: any) => <>{children}</>;

export const Switch = ({isSelected, onValueChange, onChange, children, className = ""}: { isSelected?: boolean; onValueChange?: (value: boolean) => void; onChange?: React.ChangeEventHandler<HTMLInputElement>; children?: ReactNode; className?: string; size?: string; color?: string }) => (
    <label className={`inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200 ${className}`}>
        <input type="checkbox" checked={!!isSelected} onChange={(event) => { onValueChange?.(event.target.checked); onChange?.(event); }} className="accent-primary"/>
        {children}
    </label>
);
export const Checkbox = ({isSelected, onValueChange, children, className = ""}: { isSelected?: boolean; onValueChange?: (value: boolean) => void; children?: ReactNode; className?: string; value?: string; size?: string }) => (
    <label className={`inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200 ${className}`}>
        <input type="checkbox" checked={!!isSelected} onChange={(event) => onValueChange?.(event.target.checked)} className="accent-primary"/>
        {children}
    </label>
);
export const CheckboxGroup = ({children, label, value = [], onValueChange, className = ""}: any) => (
    <div className={`flex flex-col gap-2 ${className}`}>
        {label && <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{label}</span>}
        <div className="flex flex-wrap gap-3">
            {React.Children.map(children, (child: any) => {
                const checked = value.includes(child.props.value);
                return React.cloneElement(child, {
                    isSelected: checked,
                    onValueChange: () => onValueChange?.(checked ? value.filter((item: string) => item !== child.props.value) : [...value, child.props.value]),
                });
            })}
        </div>
    </div>
);

export const Radio = ({children, value, checked, onChange}: any) => (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
        <input type="radio" value={value} checked={checked} onChange={onChange} className="accent-primary"/>
        {children}
    </label>
);
export const RadioGroup = ({children, label, value, onValueChange, onChange, className = ""}: any) => (
    <div className={`flex flex-col gap-2 ${className}`}>
        {label && <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{label}</span>}
        <div className="flex flex-wrap gap-3">
            {React.Children.map(children, (child: any) => React.cloneElement(child, {
                checked: child.props.value === value,
                onChange: () => {
                    onValueChange?.(child.props.value);
                    onChange?.({target: {value: child.props.value}});
                },
            }))}
        </div>
    </div>
);

export const Autocomplete = ({children, label, inputValue, onInputChange, className = "", ...props}: { children?: ReactNode | ((item: any) => ReactNode); label?: ReactNode; inputValue?: string; onInputChange?: (value: string) => void; className?: string; onSelectionChange?: (key: any) => void; items?: any[]; defaultItems?: any[]; selectedKey?: React.Key | null; defaultSelectedKey?: React.Key; classNames?: Record<string, string>; inputProps?: { classNames?: Record<string, string> }; [key: string]: any }) => {
    const isControlled = inputValue != null;
    const options = useMemo(() => buildAutocompleteOptions(children, props.items || props.defaultItems), [children, props.defaultItems, props.items]);
    const selectedKey = props.selectedKey == null ? null : String(props.selectedKey);
    const defaultSelectedKey = props.defaultSelectedKey == null ? undefined : String(props.defaultSelectedKey);
    const selectedOption = options.find((option) => option.key === String(selectedKey ?? defaultSelectedKey ?? ""));
    const [internalInput, setInternalInput] = useState(() => selectedOption?.textValue || "");
    const currentInput = isControlled ? inputValue || "" : (internalInput || selectedOption?.textValue || "");

    const filteredOptions = options.filter((option) => option.textValue.toLowerCase().includes(currentInput.toLowerCase()));

    const updateInput = (value: string) => {
        if (!isControlled) setInternalInput(value);
        onInputChange?.(value);
    };

    const handleSelectionChange = (key: React.Key | null) => {
        if (key == null) {
            if (props.allowsCustomValue) {
                props.onSelectionChange?.(key);
            }
            return;
        }

        const option = options.find((item) => item.key === String(key));
        if (option) {
            updateInput(option.textValue);
        }
        props.onSelectionChange?.(key);
    };

    return (
        <label className={`flex flex-col gap-1 text-sm ${className}`}>
            {label && <span className="font-bold text-zinc-700 dark:text-zinc-300">{label}</span>}
            <HeroComboBox
                selectedKey={selectedKey}
                defaultSelectedKey={defaultSelectedKey}
                inputValue={currentInput}
                onInputChange={updateInput}
                onSelectionChange={handleSelectionChange}
                allowsCustomValue={props.allowsCustomValue}
                menuTrigger="input"
            >
                <HeroComboBox.InputGroup className={props.classNames?.base || ""}>
                    <HeroInput
                        placeholder={props.placeholder}
                        value={currentInput}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateInput(event.target.value)}
                        className={`${props.inputProps?.classNames?.inputWrapper || ""} ${props.inputProps?.classNames?.input || ""}`}
                    />
                    <HeroComboBox.Trigger />
                </HeroComboBox.InputGroup>
                <HeroComboBox.Popover>
                    <HeroListBox items={filteredOptions}>
                        {(option: any) => (
                            <HeroListBox.Item id={option.key} textValue={option.textValue}>
                                {option.content}
                            </HeroListBox.Item>
                        )}
                    </HeroListBox>
                </HeroComboBox.Popover>
            </HeroComboBox>
        </label>
    );
};
export const AutocompleteItem = ({children}: any) => <>{children}</>;

type ModalContextValue = {
    onClose: () => void;
    dialogRef: React.RefObject<HTMLDivElement | null>;
};

const ModalContext = createContext<ModalContextValue>({
    onClose: () => {},
    dialogRef: {current: null},
});
type ModalRenderProps = { close: () => void };

const modalFocusableSelector = [
    "button:not([disabled])",
    "[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(", ");

const getFocusableElements = (container: HTMLDivElement | null) => {
    if (!container) return [] as HTMLElement[];
    return Array.from(container.querySelectorAll<HTMLElement>(modalFocusableSelector)).filter((element) => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true");
};

const getModalPlacementClass = (placement?: string) => {
    if (placement === "top-center" || placement === "top") return "items-start pt-16";
    if (placement === "bottom") return "items-end pb-8";
    return "items-center";
};

const getModalWidthClass = (size?: string) => {
    if (size === "5xl") return "max-w-5xl";
    if (size === "4xl") return "max-w-4xl";
    if (size === "3xl") return "max-w-3xl";
    if (size === "2xl") return "max-w-2xl";
    if (size === "xl") return "max-w-xl";
    return "max-w-lg";
};

const ModalRoot = ({isOpen, onOpenChange, children}: any) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const previousActiveElementRef = useRef<HTMLElement | null>(null);
    const onClose = () => onOpenChange?.(false);

    useEffect(() => {
        if (!isOpen) return;

        previousActiveElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

        const previousOverflow = document.body.style.overflow;
        const previousPaddingRight = document.body.style.paddingRight;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        document.body.style.overflow = "hidden";
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }

        const focusFrame = window.requestAnimationFrame(() => {
            const focusable = getFocusableElements(dialogRef.current);
            (focusable[0] || dialogRef.current)?.focus();
        });

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onOpenChange?.(false);
                return;
            }

            if (event.key !== "Tab") return;

            const focusable = getFocusableElements(dialogRef.current);
            if (focusable.length === 0) {
                event.preventDefault();
                dialogRef.current?.focus();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;

            if (event.shiftKey) {
                if (!active || active === first || !dialogRef.current?.contains(active)) {
                    event.preventDefault();
                    last.focus();
                }
                return;
            }

            if (active === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            window.cancelAnimationFrame(focusFrame);
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
            document.body.style.paddingRight = previousPaddingRight;
            previousActiveElementRef.current?.focus();
        };
    }, [isOpen, onOpenChange]);

    if (!isOpen) return null;

    return (
        <ModalContext.Provider value={{onClose, dialogRef}}>
            {children}
        </ModalContext.Provider>
    );
};

const ModalBackdrop = ({children, className = "", variant = "opaque", isDismissable = true}: any) => {
    const {onClose} = useContext(ModalContext);
    const backdropClass = variant === "blur" ? "backdrop-blur-sm" : "";

    return (
        <div
            className={`fixed inset-0 z-[100] flex justify-center bg-zinc-950/40 p-4 dark:bg-black/70 ${backdropClass} ${className}`}
            onMouseDown={isDismissable ? onClose : undefined}
        >
            {children}
        </div>
    );
};

const ModalContainer = ({children, className = "", placement = "center", size = "2xl", scroll = "inside"}: any) => (
    <div className={`flex w-full justify-center ${getModalPlacementClass(placement)} ${className}`}>
        <div className={`w-full ${getModalWidthClass(size)} ${scroll === "inside" ? "max-h-[90vh]" : ""}`}>{children}</div>
    </div>
);

const ModalDialog = ({children, className = ""}: { children?: ReactNode | ((props: ModalRenderProps) => ReactNode); className?: string }) => {
    const {onClose, dialogRef} = useContext(ModalContext);

    return (
        <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className={`overflow-y-auto rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl dark:border-white/[0.08] dark:bg-zinc-950 dark:text-zinc-100 ${className}`}
            onMouseDown={(event) => event.stopPropagation()}
        >
            {typeof children === "function" ? children({close: onClose}) : children}
        </div>
    );
};

const ModalHeader = ({children, className = ""}: any) => <div className={`border-b border-zinc-200 p-5 dark:border-white/[0.08] ${className}`}>{children}</div>;
const ModalHeading = ({children, className = ""}: any) => <div className={`font-black ${className}`}>{children}</div>;
const ModalBody = ({children, className = ""}: any) => <div className={`p-5 ${className}`}>{children}</div>;
const ModalFooter = ({children, className = ""}: any) => <div className={`flex justify-end gap-3 border-t border-zinc-200 p-5 dark:border-white/[0.08] ${className}`}>{children}</div>;
const ModalCloseTrigger = ({children = "×", className = "", ...props}: any) => {
    const {onClose} = useContext(ModalContext);

    return (
        <button
            type="button"
            className={`absolute right-4 top-4 rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100 ${className}`}
            onClick={onClose}
            {...props}
        >
            {children}
        </button>
    );
};

type ModalComponent = typeof ModalRoot & {
    Backdrop: typeof ModalBackdrop;
    Container: typeof ModalContainer;
    Dialog: typeof ModalDialog;
    Header: typeof ModalHeader;
    Heading: typeof ModalHeading;
    Body: typeof ModalBody;
    Footer: typeof ModalFooter;
    CloseTrigger: typeof ModalCloseTrigger;
};

export const Modal: ModalComponent = Object.assign(ModalRoot, {
    Backdrop: ModalBackdrop,
    Container: ModalContainer,
    Dialog: ModalDialog,
    Header: ModalHeader,
    Heading: ModalHeading,
    Body: ModalBody,
    Footer: ModalFooter,
    CloseTrigger: ModalCloseTrigger,
});

export const ModalContent = ({children}: { children: ReactNode | ((onClose: () => void) => ReactNode) }) => {
    const {onClose} = useContext(ModalContext);
    return <ModalDialog>{typeof children === "function" ? ({close}: {close: () => void}) => children(close) : children}</ModalDialog>;
};

const getColumnKey = (column: any) => column?.uid ?? column?.key ?? column;

const TableStyleContext = createContext<{
    th?: string;
    td?: string;
    tr?: string;
    isStriped?: boolean;
}>({});

const TableRoot = ({children, className = "", classNames, sortDescriptor, onSortChange, isStriped, ...props}: { children?: ReactNode; className?: string; classNames?: Record<string, string>; sortDescriptor?: SortDescriptor; onSortChange?: (descriptor: SortDescriptor) => void; isStriped?: boolean; [key: string]: unknown }) => {
    const childArray = React.Children.toArray(children);
    const header = childArray.find((child: any) => React.isValidElement(child) && child.type === TableHeader) as React.ReactElement<any> | undefined;
    const columns = header?.props?.columns?.map(getColumnKey);

    return (
        <TableStyleContext.Provider value={{th: classNames?.th, td: classNames?.td, tr: classNames?.tr, isStriped}}>
            <HeroTable className={`overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-zinc-950 ${classNames?.wrapper || ""} ${className}`}>
                <HeroTable.ScrollContainer className="w-full overflow-x-auto">
                    <HeroTable.Content
                        {...(props as any)}
                        className="w-full border-separate border-spacing-0 text-sm"
                        sortDescriptor={sortDescriptor as any}
                        onSortChange={onSortChange as any}
                    >
                        {childArray.map((child: any) => {
                            if (React.isValidElement(child) && child.type === TableBody) {
                                return React.cloneElement(child as React.ReactElement<any>, {__columns: columns});
                            }
                            return child;
                        })}
                    </HeroTable.Content>
                </HeroTable.ScrollContainer>
            </HeroTable>
        </TableStyleContext.Provider>
    );
};
const TableHeader = ({children, columns}: { children?: ReactNode | ((column: any) => React.ReactElement<any>); columns?: any[] }) => (
    <HeroTable.Header className="text-left text-zinc-500 dark:text-zinc-400" columns={columns}>
        {typeof children === "function" ? (
            (column: any) => {
                const rendered = children(column);
                return React.cloneElement(rendered, {__columnKey: getColumnKey(column)});
            }
        ) : (children as ReactNode)}
    </HeroTable.Header>
);
const TableBody = ({children, items, emptyContent, isLoading, loadingContent, __columns}: { children?: ReactNode | ((item: any) => ReactNode); items?: any[]; emptyContent?: ReactNode; isLoading?: boolean; loadingContent?: ReactNode; __columns?: any[]; [key: string]: unknown }) => {
    const bodyItems = isLoading ? [] : (items || []);
    const emptyState = isLoading
        ? (
            <div className="px-3 py-8 text-center text-zinc-500 dark:text-zinc-400">
                <div className="inline-flex items-center gap-2">
                    <Spinner className="h-4 w-4 border-2"/>
                    <span>{loadingContent || "加载中..."}</span>
                </div>
            </div>
        )
        : emptyContent;

    return (
        <HeroTable.Body items={typeof children === "function" ? bodyItems : undefined} renderEmptyState={() => emptyState}>
            {typeof children === "function"
                ? (item: any) => {
                    const row = children(item);
                    return React.isValidElement(row) ? React.cloneElement(row as React.ReactElement<any>, {item, __columns}) : row;
                }
                : children}
        </HeroTable.Body>
    );
};
const TableColumn = ({children, className = "", allowsSorting, __columnKey, align, ...props}: any) => {
    const styles = useContext(TableStyleContext);
    const alignClass = align === "center"
        ? "text-center"
        : align === "end" || align === "right"
            ? "text-right"
            : "text-left";

    return (
        <HeroTable.Column
            {...props}
            id={__columnKey ?? props.id}
            allowsSorting={allowsSorting}
            className={({sortDirection}: { sortDirection?: "ascending" | "descending" }) => `border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-black uppercase tracking-wide first:rounded-tl-xl last:rounded-tr-xl dark:border-white/[0.08] dark:bg-zinc-900/80 ${allowsSorting ? "cursor-pointer select-none hover:text-primary" : ""} ${sortDirection ? "text-primary" : ""} ${alignClass} ${styles.th || ""} ${className}`}
        >
            {({sortDirection}: { sortDirection?: "ascending" | "descending" }) => (
                <span className={`inline-flex items-center gap-1.5 ${alignClass === "text-center" ? "w-full justify-center" : ""}`}>
                    {children}
                    {allowsSorting && (
                        <span className={`text-[10px] transition-opacity ${sortDirection ? "opacity-100" : "opacity-35"}`}>
                            {sortDirection === "descending" ? "▼" : "▲"}
                        </span>
                    )}
                </span>
            )}
        </HeroTable.Column>
    );
};
const TableRow = ({children, item, __columns}: { children?: ReactNode | ((columnKey: any) => ReactNode); item?: any; __columns?: any[]; [key: string]: unknown }) => {
    const styles = useContext(TableStyleContext);
    const columns = __columns && __columns.length > 0 ? __columns : Object.keys(item || {});
    return (
        <HeroTable.Row className={`transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.04] ${styles.isStriped ? "odd:bg-zinc-50/60 dark:odd:bg-white/[0.025]" : ""} ${styles.tr || ""}`} columns={typeof children === "function" ? columns : undefined}>
            {typeof children === "function" ? columns.map((columnKey) => <React.Fragment key={String(columnKey)}>{children(columnKey)}</React.Fragment>) : children}
        </HeroTable.Row>
    );
};
const TableCell = ({children, className = ""}: any) => {
    const styles = useContext(TableStyleContext);
    return <HeroTable.Cell className={`border-b border-zinc-100 px-4 py-3 align-middle text-zinc-700 last:text-right dark:border-white/[0.05] dark:text-zinc-200 ${styles.td || ""} ${className}`}>{children}</HeroTable.Cell>;
};
export const Table = Object.assign(TableRoot, {
    Header: TableHeader,
    Body: TableBody,
    Column: TableColumn,
    Row: TableRow,
    Cell: TableCell,
});
export {TableHeader, TableBody, TableColumn, TableRow, TableCell};
export const getKeyValue = (item: any, key: string) => item?.[key];

const normalizeReactKey = (key: React.Key | null | undefined) => {
    if (key == null) return "";
    return String(key).replace(/^\.\$/, "").replace(/^\./, "");
};

const buildAutocompleteOptions = (children: ReactNode | ((item: any) => ReactNode), sourceItems?: any[]) => {
    const renderOption = (node: any) => {
        if (!React.isValidElement(node)) return null;
        const element = node as React.ReactElement<any>;
        return {
            key: normalizeReactKey(element.key),
            textValue: String(element.props.textValue ?? element.props.children ?? ""),
            content: element.props.children,
        };
    };

    if (typeof children === "function") {
        return Array.from(sourceItems || []).map((item: any) => renderOption(children(item))).filter(Boolean) as Array<{ key: string; textValue: string; content: ReactNode }>;
    }

    return React.Children.toArray(children).map(renderOption).filter(Boolean) as Array<{ key: string; textValue: string; content: ReactNode }>;
};

const normalizeKeys = (keys?: Iterable<React.Key>) => Array.from(keys || []).map((key) => String(key));

type SelectOption = {
    key: string;
    label: ReactNode;
    textValue: string;
};

const SelectImpl = ({children, label, selectedKeys, defaultSelectedKeys, onSelectionChange, onChange, className = "", placeholder, selectionMode, ...props}: SelectProps) => {
    const isMultiple = selectionMode === "multiple";
    const isControlled = selectedKeys != null;
    const [internalSelected, setInternalSelected] = useState<string[]>(() => normalizeKeys(defaultSelectedKeys));
    const [isOpen, setIsOpen] = useState(false);

    const options = useMemo(() => React.Children.toArray(children).map((child: any) => {
        if (!React.isValidElement(child)) return null;
        const element = child as React.ReactElement<any>;
        return {
            key: normalizeReactKey(element.key),
            label: element.props.children,
            textValue: String(element.props.children),
        };
    }).filter(Boolean) as SelectOption[], [children]);

    const currentSelected = isControlled ? normalizeKeys(selectedKeys) : internalSelected;
    const selectedOptions = options.filter((option) => currentSelected.includes(option.key));
    const triggerText = selectedOptions.length === 0
        ? (placeholder || "请选择")
        : isMultiple
            ? selectedOptions.map((option) => option.textValue).join(", ")
            : selectedOptions[0]?.textValue;

    const commitSelection = (values: string[]) => {
        if (!isControlled) {
            setInternalSelected(values);
        }

        onSelectionChange?.(new Set(values));

        if (onChange) {
            const value = isMultiple ? values : values[0] || "";
            onChange({target: {value}} as React.ChangeEvent<HTMLSelectElement>);
        }
    };

    const toggleOption = (key: string) => {
        const next = isMultiple
            ? currentSelected.includes(key)
                ? currentSelected.filter((value) => value !== key)
                : [...currentSelected, key]
            : [key];

        commitSelection(next);
        if (!isMultiple) {
            setIsOpen(false);
        }
    };

    return (
        <label className={`relative flex flex-col gap-1 text-sm ${className}`}>
            {label && <span className="font-bold text-zinc-700 dark:text-zinc-300">{label}</span>}
            <button
                type="button"
                className={`${fieldClass} flex items-center justify-between gap-3 text-left ${currentSelected.length === 0 ? "text-zinc-400 dark:text-zinc-600" : ""}`}
                onClick={() => setIsOpen((open) => !open)}
                onBlur={(event) => {
                    if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node)) {
                        setIsOpen(false);
                    }
                }}
            >
                <span className="truncate">{triggerText}</span>
                <span className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
            </button>
            {isOpen && (
                <div className="absolute top-full z-40 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-white/[0.08] dark:bg-zinc-950">
                    {options.map((option) => {
                        const checked = currentSelected.includes(option.key);
                        return (
                            <button
                                key={option.key}
                                type="button"
                                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => toggleOption(option.key)}
                            >
                                <span>{option.label}</span>
                                {checked && <span className="text-primary">✓</span>}
                            </button>
                        );
                    })}
                </div>
            )}
            <input type="hidden" required={props.isRequired || props.required} value={isMultiple ? currentSelected.join(",") : (currentSelected[0] || "")} />
        </label>
    );
};

const TabsContext = createContext<{
    selectedKey: string;
    setSelectedKey: (key: string) => void;
    classNames?: Record<string, string>;
}>({
    selectedKey: "",
    setSelectedKey: () => {},
});

const TabContext = createContext<{ active: boolean }>({active: false});

const TabsRoot = ({defaultSelectedKey, selectedKey, onSelectionChange, children, className = "", classNames}: { defaultSelectedKey?: React.Key; selectedKey?: React.Key; onSelectionChange?: (key: any) => void; children?: ReactNode; className?: string; classNames?: Record<string, string>; [key: string]: unknown }) => {
    const childArray = React.Children.toArray(children);
    const panelIds = childArray
        .filter((child): child is React.ReactElement<any> => React.isValidElement(child) && child.type === TabsPanel)
        .map((child) => String(child.props.id));
    const [internal, setInternal] = useState(normalizeReactKey(selectedKey || defaultSelectedKey || panelIds[0] || ""));
    const current = normalizeReactKey(selectedKey || internal);

    const setCurrent = (key: string) => {
        if (selectedKey == null) {
            setInternal(key);
        }
        onSelectionChange?.(key);
    };

    return (
        <TabsContext.Provider value={{selectedKey: current, setSelectedKey: setCurrent, classNames}}>
            <div className={`w-full ${classNames?.base || ""} ${className}`}>{children}</div>
        </TabsContext.Provider>
    );
};

const TabsListContainer = ({children, className = ""}: any) => <div className={className}>{children}</div>;

const TabsList = ({children, className = "", ...props}: any) => {
    const {classNames} = useContext(TabsContext);
    return <div {...props} className={`flex gap-4 overflow-x-auto border-b border-zinc-200 dark:border-white/[0.08] ${classNames?.tabList || ""} ${className}`}>{children}</div>;
};

const TabsIndicator = ({className = ""}: any) => {
    const {active} = useContext(TabContext);
    if (!active) return null;
    return <span className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary ${className}`}/>;
};

const TabsTab = ({children, id, className = ""}: any) => {
    const {selectedKey, setSelectedKey, classNames} = useContext(TabsContext);
    const active = String(id) === selectedKey;

    return (
        <TabContext.Provider value={{active}}>
            <button
                type="button"
                className={`relative h-11 shrink-0 rounded-md px-1 font-bold transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${classNames?.tab || ""} ${active ? "text-primary" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"} ${className}`}
                onClick={() => setSelectedKey(String(id))}
            >
                <span className={classNames?.tabContent || ""}>{children}</span>
            </button>
        </TabContext.Provider>
    );
};

const TabsPanel = ({children, id, className = ""}: any) => {
    const {selectedKey, classNames} = useContext(TabsContext);
    if (String(id) !== selectedKey) return null;
    return <div className={`py-4 ${classNames?.panel || ""} ${className}`}>{children}</div>;
};

export const Tabs = Object.assign(TabsRoot, {
    ListContainer: TabsListContainer,
    List: TabsList,
    Tab: TabsTab,
    Panel: TabsPanel,
    Indicator: TabsIndicator,
});

export const Tab = ({children}: { children?: ReactNode }) => <>{children}</>;

export const Accordion = ({children, className = ""}: any) => <div className={`flex flex-col gap-2 ${className}`}>{children}</div>;
export const AccordionItem = ({children, title}: any) => (
    <details className="group rounded-xl border border-zinc-200 bg-white px-4 py-2 transition-colors hover:border-primary/50 hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-zinc-950 dark:hover:bg-zinc-900">
        <summary className="cursor-pointer list-none">{title}</summary>
        <div className="pt-3">{children}</div>
    </details>
);

export const Snippet = ({children, codeString}: any) => (
    <button type="button" className="rounded-lg bg-emerald-500/15 px-2 py-1 text-sm font-bold text-emerald-300 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50" onClick={() => navigator.clipboard.writeText(codeString || String(children))}>
        {children}
    </button>
);
