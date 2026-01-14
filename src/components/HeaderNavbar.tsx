import React from "react";
import { ChefHat, ChevronLeft, ChevronRight, Menu, User } from "lucide-react";

interface HeaderNavbarProps {
  toggleSidebar: () => void;
  sidebarWidth: number;
  setSidebarWidth: React.Dispatch<React.SetStateAction<number>>;
}

function HeaderNavbar({
  toggleSidebar,
  sidebarWidth,
  setSidebarWidth,
}: HeaderNavbarProps) {
  const handleWidthChange = (delta: number) => {
    setSidebarWidth((prev: number) =>
      Math.min(Math.max(prev + delta, 240), 400)
    );
  };

  return (
    <div className="bg-white border-b-2 border-orange-200 p-4 shadow-lg flex items-center justify-between sticky top-0 z-20 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <ChefHat className="text-orange-600" size={24} />
          <h1 className="text-xl font-black text-gray-800">
            AI Chef Assistant
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 bg-orange-50 rounded-lg p-1.5">
          <button
            onClick={() => handleWidthChange(-20)}
            className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors"
            title="Narrow sidebar"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-bold text-orange-600 px-2">
            {sidebarWidth}px
          </span>
          <button
            onClick={() => handleWidthChange(20)}
            className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors"
            title="Widen sidebar"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <button className="flex items-center p-1 rounded-full bg-orange-50 hover:bg-orange-100 transition duration-150 shadow-md border-2 border-orange-200">
          <div className="h-9 w-9 rounded-full bg-orange-600 flex items-center justify-center text-white font-semibold text-base">
            <User size={20} />
          </div>
        </button>
      </div>
    </div>
  );
}

export default HeaderNavbar;
