import Image from "next/image";
import Link from "next/link";

import { UserNav } from "@/library/components/molecules/nav-user";
import { cn } from "@/library/utils";

const Header = ({ className }: { className?: string }) => {
  return (
    <header className={cn("border-border border-b", className)}>
      <div className="flex items-center px-4 py-2">
        <div className="flex items-center">
          <Link href={"/"}>
            <Image
              alt="pander logo"
              src="/logo.svg"
              width={70}
              height={70}
            />
          </Link>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <UserNav />
        </div>
      </div>
    </header>
  );
};

export default Header;
