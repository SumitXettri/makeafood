import { ChefHat, User } from "lucide-react";

function HeaderNavbar() {
  return (
    <div className="bg-white border-b-2 max-h-15 border-orange-200 p-4 shadow-lg flex items-center justify-between sticky top-0 z-10 flex-shrink-0">
      {/* Title/Logo for Mobile View */}
      <div className="flex items-center gap-2 md:hidden">
        <ChefHat className="text-orange-600" size={24} />
        <h1 className="text-xl font-black text-gray-800">AI Chef Assistant</h1>
      </div>

      {/* Spacer for Desktop View (kept for layout alignment) */}
      <div className="hidden md:block w-1/4 text-center text-orange-500">
        {/* Placeholder content removed to clean up rendering */}
      </div>

      {/* Profile/Actions */}
      <div className="flex items-center space-x-4">
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
