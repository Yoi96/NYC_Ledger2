import React from "react";
import {
  TrainFront,
  Bus,
  UtensilsCrossed,
  Coffee,
  Pizza,
  ShoppingBag,
  ShoppingCart,
  Apple,
  Home,
  Zap,
  Wifi,
  Shirt,
  Sparkles,
  Tag,
  Ticket,
  PartyPopper,
  Music,
  Scissors,
  Dumbbell,
  CreditCard,
  Wallet,
  TrendingUp,
  PiggyBank,
  HelpCircle,
  Building2,
  DollarSign,
  Package,
  RefreshCw,
} from "lucide-react";
import { NYCExpenseCategory } from "../types";

interface CategoryIconProps {
  category?: string;
  subCategory?: string;
  customIcon?: string;
  type?: "INCOME" | "EXPENSE";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category = "Other",
  subCategory = "",
  customIcon = "",
  type = "EXPENSE",
  size = "md",
  className = "",
}) => {
  // Determine icon size
  const iconSizeClass =
    size === "sm"
      ? "w-3.5 h-3.5"
      : size === "lg"
      ? "w-6 h-6"
      : size === "xl"
      ? "w-7 h-7"
      : "w-5 h-5";

  const containerSizeClass =
    size === "sm"
      ? "w-7 h-7 rounded-lg"
      : size === "lg"
      ? "w-12 h-12 rounded-2xl"
      : size === "xl"
      ? "w-14 h-14 rounded-2xl"
      : "w-10 h-10 rounded-xl";

  // Check custom icon first if user specified one
  if (customIcon) {
    const cKey = customIcon.toLowerCase();
    if (cKey.includes("utensil") || cKey.includes("food") || cKey.includes("dining") || cKey.includes("halal") || cKey.includes("breakfast") || cKey.includes("meal")) {
      return (
        <div className={`${containerSizeClass} bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}>
          <UtensilsCrossed className={iconSizeClass} />
        </div>
      );
    }
    if (cKey.includes("coffee") || cKey.includes("tea") || cKey.includes("cafe")) {
      return (
        <div className={`${containerSizeClass} bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}>
          <Coffee className={iconSizeClass} />
        </div>
      );
    }
    if (cKey.includes("pizza")) {
      return (
        <div className={`${containerSizeClass} bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}>
          <Pizza className={iconSizeClass} />
        </div>
      );
    }
    if (cKey.includes("train") || cKey.includes("subway") || cKey.includes("mta")) {
      return (
        <div className={`${containerSizeClass} bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}>
          <TrainFront className={iconSizeClass} />
        </div>
      );
    }
    if (cKey.includes("bus")) {
      return (
        <div className={`${containerSizeClass} bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}>
          <Bus className={iconSizeClass} />
        </div>
      );
    }
    if (cKey.includes("cart") || cKey.includes("grocer")) {
      return (
        <div className={`${containerSizeClass} bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}>
          <ShoppingCart className={iconSizeClass} />
        </div>
      );
    }
    if (cKey.includes("apple") || cKey.includes("fruit")) {
      return (
        <div className={`${containerSizeClass} bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}>
          <Apple className={iconSizeClass} />
        </div>
      );
    }
    if (cKey.includes("makeup") || cKey.includes("lipstick") || cKey.includes("cosmetic") || cKey.includes("beauty")) {
      return (
        <div className={`${containerSizeClass} bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}>
          <span className="text-base leading-none">💄</span>
        </div>
      );
    }
    if (cKey.includes("bag") || cKey.includes("shopping")) {
      return (
        <div className={`${containerSizeClass} bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}>
          <ShoppingBag className={iconSizeClass} />
        </div>
      );
    }
    if (cKey.includes("shirt") || cKey.includes("cloth")) {
      return (
        <div className={`${containerSizeClass} bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}>
          <Shirt className={iconSizeClass} />
        </div>
      );
    }
    if (cKey.includes("home") || cKey.includes("rent")) {
      return (
        <div className={`${containerSizeClass} bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}>
          <Home className={iconSizeClass} />
        </div>
      );
    }
    if (cKey.includes("zap") || cKey.includes("electric") || cKey.includes("power")) {
      return (
        <div className={`${containerSizeClass} bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}>
          <Zap className={iconSizeClass} />
        </div>
      );
    }
    if (cKey.includes("wifi") || cKey.includes("internet")) {
      return (
        <div className={`${containerSizeClass} bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}>
          <Wifi className={iconSizeClass} />
        </div>
      );
    }
    if (cKey.includes("ticket") || cKey.includes("show")) {
      return (
        <div className={`${containerSizeClass} bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}>
          <Ticket className={iconSizeClass} />
        </div>
      );
    }
    if (cKey.includes("music") || cKey.includes("concert")) {
      return (
        <div className={`${containerSizeClass} bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}>
          <Music className={iconSizeClass} />
        </div>
      );
    }
    if (cKey.includes("dumbbell") || cKey.includes("gym")) {
      return (
        <div className={`${containerSizeClass} bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}>
          <Dumbbell className={iconSizeClass} />
        </div>
      );
    }
    if (cKey.includes("scissor") || cKey.includes("salon")) {
      return (
        <div className={`${containerSizeClass} bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}>
          <Scissors className={iconSizeClass} />
        </div>
      );
    }
    if (cKey.includes("card") || cKey.includes("credit")) {
      return (
        <div className={`${containerSizeClass} bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}>
          <CreditCard className={iconSizeClass} />
        </div>
      );
    }
    if (cKey.includes("trending") || cKey.includes("income") || cKey.includes("wage")) {
      return (
        <div className={`${containerSizeClass} bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}>
          <TrendingUp className={iconSizeClass} />
        </div>
      );
    }
    if (cKey.includes("sparkles")) {
      return (
        <div className={`${containerSizeClass} bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}>
          <Sparkles className={iconSizeClass} />
        </div>
      );
    }
  }

  // Income specific styling
  if (type === "INCOME" || category === "Income") {
    return (
      <div
        className={`${containerSizeClass} bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}
      >
        <TrendingUp className={iconSizeClass} />
      </div>
    );
  }

  const catLower = category.toLowerCase();
  const subLower = subCategory.toLowerCase();

  // Transit
  if (catLower.includes("transit") || catLower.includes("mta") || catLower.includes("subway")) {
    let IconComponent = TrainFront;
    if (subLower.includes("bus")) IconComponent = Bus;
    return (
      <div
        className={`${containerSizeClass} bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}
      >
        <IconComponent className={iconSizeClass} />
      </div>
    );
  }

  // Food & Beverage
  if (catLower.includes("food") || catLower.includes("beverage") || catLower.includes("dining")) {
    let IconComponent = UtensilsCrossed;
    // Breakfast/Quick Meal should use UtensilsCrossed (like The Halal Guys)
    if (subLower.includes("breakfast") || subLower.includes("quick meal") || subLower.includes("diner") || subLower.includes("brunch")) {
      IconComponent = UtensilsCrossed;
    } else if (subLower.includes("coffee") || subLower.includes("bakery") || subLower.includes("tea")) {
      IconComponent = Coffee;
    } else if (subLower.includes("pizza") || subLower.includes("slice")) {
      IconComponent = Pizza;
    }
    return (
      <div
        className={`${containerSizeClass} bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}
      >
        <IconComponent className={iconSizeClass} />
      </div>
    );
  }

  // Groceries
  if (catLower.includes("grocer")) {
    let IconComponent = ShoppingCart;
    if (subLower.includes("fruit") || subLower.includes("greenmarket")) {
      IconComponent = Apple;
    }
    return (
      <div
        className={`${containerSizeClass} bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}
      >
        <IconComponent className={iconSizeClass} />
      </div>
    );
  }

  // Housing & Utilities
  if (catLower.includes("housing") || catLower.includes("utilit")) {
    let IconComponent = Home;
    if (subLower.includes("electric") || subLower.includes("coned") || subLower.includes("power")) {
      IconComponent = Zap;
    } else if (subLower.includes("internet") || subLower.includes("spectrum") || subLower.includes("fios") || subLower.includes("wifi")) {
      IconComponent = Wifi;
    } else if (subLower.includes("rent") || subLower.includes("building")) {
      IconComponent = Building2;
    }
    return (
      <div
        className={`${containerSizeClass} bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}
      >
        <IconComponent className={iconSizeClass} />
      </div>
    );
  }

  // Shopping & Fashion
  if (catLower.includes("shopping") || catLower.includes("fashion")) {
    let IconComponent = Shirt;
    if (subLower.includes("beauty") || subLower.includes("skincare") || subLower.includes("care")) {
      IconComponent = Sparkles;
    } else if (subLower.includes("electronic") || subLower.includes("apple")) {
      IconComponent = Package;
    } else if (subLower.includes("thrift") || subLower.includes("vintage")) {
      IconComponent = Tag;
    }
    return (
      <div
        className={`${containerSizeClass} bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}
      >
        <IconComponent className={iconSizeClass} />
      </div>
    );
  }

  // Culture & Fun
  if (catLower.includes("culture") || catLower.includes("fun") || catLower.includes("entertainment")) {
    let IconComponent = Ticket;
    if (subLower.includes("concert") || subLower.includes("jazz") || subLower.includes("music")) {
      IconComponent = Music;
    } else if (subLower.includes("party") || subLower.includes("club")) {
      IconComponent = PartyPopper;
    }
    return (
      <div
        className={`${containerSizeClass} bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}
      >
        <IconComponent className={iconSizeClass} />
      </div>
    );
  }

  // Services
  if (catLower.includes("service")) {
    let IconComponent = Scissors;
    if (subLower.includes("gym") || subLower.includes("equinox") || subLower.includes("fitness")) {
      IconComponent = Dumbbell;
    }
    return (
      <div
        className={`${containerSizeClass} bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}
      >
        <IconComponent className={iconSizeClass} />
      </div>
    );
  }

  // Bottle Deposit
  if (catLower.includes("bottle") || catLower.includes("deposit") || subLower.includes("bottle")) {
    return (
      <div
        className={`${containerSizeClass} bg-lime-500/20 text-lime-400 border border-lime-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}
      >
        <RefreshCw className={iconSizeClass} />
      </div>
    );
  }

  // Credit Card Payment
  if (catLower.includes("credit") || catLower.includes("card")) {
    return (
      <div
        className={`${containerSizeClass} bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-sm ${className}`}
      >
        <CreditCard className={iconSizeClass} />
      </div>
    );
  }

  // Default / Other
  return (
    <div
      className={`${containerSizeClass} bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center shrink-0 shadow-sm ${className}`}
    >
      <Sparkles className={iconSizeClass} />
    </div>
  );
};
