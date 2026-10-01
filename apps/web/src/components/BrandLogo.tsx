import { twMerge } from "tailwind-merge";

import { getAppName, getLogoUrls } from "~/utils/brand";

export const BrandLogo = ({ className }: { className?: string }) => {
  const name = getAppName();
  const { light, dark } = getLogoUrls();

  return (
    <span
      className={twMerge(
        "inline-flex items-center gap-2.5 font-bold tracking-tight text-light-1000 dark:text-dark-1000",
        className,
      )}
    >
      {light && (
        <>
          <img src={light} alt="" className="h-7 w-auto dark:hidden" />
          <img src={dark} alt="" className="hidden h-7 w-auto dark:block" />
        </>
      )}
      {name}
    </span>
  );
};
