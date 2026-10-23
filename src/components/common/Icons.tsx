import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  StarIcon,
  News01Icon,
  Archive01Icon,
  Delete02Icon,
  Edit02Icon,
  CircleArrowReload01Icon,
  Logout01Icon,
  Add01Icon,
  Search01Icon,
  SidebarLeft01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  SparklesIcon,
  Sun01Icon,
  Moon01Icon,
  LaptopIcon,
  Cancel01Icon,
  Alert02Icon,
  InformationCircleIcon,
  CheckmarkCircle02Icon,
  Attachment01Icon,
  SentIcon,
  Minimize01Icon,
  Maximize01Icon,
  FilterIcon,
} from "@hugeicons/core-free-icons";

interface IconProps {
  size?: number | string;
  className?: string;
  color?: string;
}

export const HugeIcon: React.FC<
  IconProps & { icon: any }
> = ({ icon, size = 16, className = "", color }) => (
  <HugeiconsIcon icon={icon} size={size} className={className} color={color} />
);

export const Icons = {
  Mail: (props: IconProps) => <HugeIcon icon={Mail01Icon} {...props} />,
  Star: (props: IconProps) => <HugeIcon icon={StarIcon} {...props} />,
  News: (props: IconProps) => <HugeIcon icon={News01Icon} {...props} />,
  Archive: (props: IconProps) => <HugeIcon icon={Archive01Icon} {...props} />,
  Trash: (props: IconProps) => <HugeIcon icon={Delete02Icon} {...props} />,
  Edit: (props: IconProps) => <HugeIcon icon={Edit02Icon} {...props} />,
  Reload: (props: IconProps) => <HugeIcon icon={CircleArrowReload01Icon} {...props} />,
  Logout: (props: IconProps) => <HugeIcon icon={Logout01Icon} {...props} />,
  Add: (props: IconProps) => <HugeIcon icon={Add01Icon} {...props} />,
  Search: (props: IconProps) => <HugeIcon icon={Search01Icon} {...props} />,
  Sidebar: (props: IconProps) => <HugeIcon icon={SidebarLeft01Icon} {...props} />,
  ArrowRight: (props: IconProps) => <HugeIcon icon={ArrowRight01Icon} {...props} />,
  ArrowLeft: (props: IconProps) => <HugeIcon icon={ArrowLeft01Icon} {...props} />,
  Sparkles: (props: IconProps) => <HugeIcon icon={SparklesIcon} {...props} />,
  Sun: (props: IconProps) => <HugeIcon icon={Sun01Icon} {...props} />,
  Moon: (props: IconProps) => <HugeIcon icon={Moon01Icon} {...props} />,
  Laptop: (props: IconProps) => <HugeIcon icon={LaptopIcon} {...props} />,
  Close: (props: IconProps) => <HugeIcon icon={Cancel01Icon} {...props} />,
  Alert: (props: IconProps) => <HugeIcon icon={Alert02Icon} {...props} />,
  Info: (props: IconProps) => <HugeIcon icon={InformationCircleIcon} {...props} />,
  Check: (props: IconProps) => <HugeIcon icon={CheckmarkCircle02Icon} {...props} />,
  Attachment: (props: IconProps) => <HugeIcon icon={Attachment01Icon} {...props} />,
  Send: (props: IconProps) => <HugeIcon icon={SentIcon} {...props} />,
  Minimize: (props: IconProps) => <HugeIcon icon={Minimize01Icon} {...props} />,
  Maximize: (props: IconProps) => <HugeIcon icon={Maximize01Icon} {...props} />,
  Filter: (props: IconProps) => <HugeIcon icon={FilterIcon} {...props} />,
};

export {
  Mail01Icon,
  StarIcon,
  News01Icon,
  Archive01Icon,
  Delete02Icon,
  Edit02Icon,
  CircleArrowReload01Icon,
  Logout01Icon,
  Add01Icon,
  Search01Icon,
  SidebarLeft01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  SparklesIcon,
  Sun01Icon,
  Moon01Icon,
  LaptopIcon,
  Cancel01Icon,
  Alert02Icon,
  InformationCircleIcon,
  CheckmarkCircle02Icon,
  Attachment01Icon,
  SentIcon,
  Minimize01Icon,
  Maximize01Icon,
  FilterIcon,
};
