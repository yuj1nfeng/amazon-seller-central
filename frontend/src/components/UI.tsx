import React from "react";

type CN = Array<string | undefined | null | false>;
const cn = (...args: CN) => args.filter(Boolean).join(" ");

/**
 * Auth 页用：使用新的 logo 图片
 * 指导：替换为 public/log.png 图片
 */
export const BrandLogo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={cn("flex flex-col items-center select-none", className)}>
      <img 
        src="/log.png" 
        alt="Logo" 
        className="h-[40px] object-contain pt-2 pb-1" // 添加了一些上下边距
      />
    </div>
  );
};

/**
 * App(控制台) Header 用：MainLayout.tsx 会 import { ConsoleLogo }
 * ✅ 现在使用新的 logo 图片
 */
// export const ConsoleLogo = ({ className = "" }: { className?: string }) => {
//   return (
//     <div className={cn("flex items-center select-none", className)}>
//       <img 
//         src="/log.png" 
//         alt="Logo" 
//         className="h-[30px] object-contain my-auto" // 添加垂直居中对齐
//       />
//     </div>
//   );
// };
export const ConsoleLogo = ({ className = "" }: { className?: string }) => {
  return (
    <div
      className={cn("flex items-center select-none", className)}
      aria-label="amazon seller central"
      style={{
        fontFamily: "Amazon Ember, Segoe UI, Arial, Helvetica, sans-serif",
        WebkitFontSmoothing: "antialiased",
        textRendering: "geometricPrecision",
      }}
    >
      <div className="relative">
        <div className="flex items-baseline gap-[6px]">
          <span className="text-[15px] font-bold text-white leading-none tracking-tight">
            amazon
          </span>
          <span className="text-[15px] font-medium text-white leading-none tracking-tight">
            seller central
          </span>
        </div>

        {/* orange smile (更贴近 console header 版本) */}
      {/* orange smile — header version (arrow points to "z") */}
        <svg
          className="absolute left-[1px] top-[11px]"
          width="36"
          height="10"
          viewBox="0 0 72 10"
          fill="none"
        >
          {/* 主弧线：更弯曲版本 */}
          <path
            d="M2 3.2C16 7.8 46 7.8 66 3.2"
            stroke="#FF9900"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* 箭头：指向 z */}
          <path
            d="M58 2.8L66 3.2L60.5 8.2"
            stroke="#FF9900"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>


      </div>
    </div>
  );
};

export const Card = ({
  children,
  className = "",
  title,
  headerAction,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  headerAction?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "amz-card bg-white border border-[#D5D9D9] rounded-[8px] shadow-none w-full min-w-0",
        className
      )}
    >
      {title && (
        <div className="px-4 py-2 border-b border-[#D5D9D9] flex justify-between items-center bg-[#F7F8FA]">
          <span className="font-bold text-[13px] text-[#0F1111]">{title}</span>
          {headerAction}
        </div>
      )}
      <div className={cn("p-[20px_20px_16px_20px]")}>
        {children}
      </div>
    </div>
  );
};

type ButtonVariant = "yellow" | "white";

export const Button = ({
  children,
  className = "",
  variant = "yellow",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) => {
  const base =
    "w-full h-[31px] text-[13px] font-medium rounded-full " +
    "flex items-center justify-center select-none " +
    "focus:outline-none focus:shadow-[0_0_0_3px_rgba(0,113,133,0.20)]";

  const styles: Record<ButtonVariant, string> = {
    yellow: "amz-btn-yellow",
    white: "amz-btn-white",
  };

  return (
    <button
      type={type}
      className={cn(base, styles[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helper?: string;
  helperIcon?: React.ReactNode;
  inputClassName?: string;
};

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  (
    { label, error, helper, helperIcon, className = "", inputClassName = "", ...props },
    ref
  ) => {
    return (
      <div className={cn("mb-[12px]", className)}>
        {label ? (
          <label className="block text-[13px] font-bold mb-[4px] text-[#0F1111] leading-[16px]">
            {label}
          </label>
        ) : null}

        <input
          ref={ref}
          className={cn(
            "amz-input-base amz-input-focus",
            error ? "border-[#D00] shadow-[0_0_0_3px_rgba(221,0,0,0.10)]" : "",
            inputClassName
          )}
          {...props}
        />

        {helper ? (
          <div className="mt-[6px] flex items-start gap-[8px] text-[12px] text-[#0F1111] leading-[16px]">
            {helperIcon ? <div className="mt-[1px]">{helperIcon}</div> : null}
            <div>{helper}</div>
          </div>
        ) : null}

        {error ? (
          <div className="mt-[6px] text-[12px] text-[#D00] leading-[16px]">
            {error}
          </div>
        ) : null}
      </div>
    );
  }
);

InputField.displayName = "InputField";
