import Image from "next/image";
import AppTransitionLink from "../../AppTransitionLink";

export default function NavbarLogo({ brand }) {
  return (
    <AppTransitionLink
      href="/customer"
      transitionMessage="Menyiapkan beranda customer..."
      className="flex items-center gap-3"
    >
      <div className="relative h-9 w-9">
        <Image
          src="/logoherosection.png"
          alt="Growtech"
          fill
          priority
          sizes="36px"
        />
      </div>

      <span className="hidden text-lg font-semibold text-white sm:block">
        {brand?.site_name || "Growtech Central"}
      </span>
    </AppTransitionLink>
  );
}