import { ChefHat, Plus, History, AlertCircle, X } from "lucide-react";

interface ChatMessage {
  type: "user" | "ai";
  content: string;
}

interface HistorySidebarProps {
  chatHistory: ChatMessage[];
  handleNewRecipe: () => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  sidebarWidth: number;
}

function HistorySidebar({
  chatHistory,
  handleNewRecipe,
  isOpen,
  toggleSidebar,
  sidebarWidth,
}: HistorySidebarProps) {
  return (
    <div
      className={`${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 fixed md:relative z-30 h-full bg-white border-r-2 border-orange-100 flex flex-col shadow-2xl transition-all duration-300 ease-in-out`}
      style={{ width: `${sidebarWidth}px` }}
    >
      <div className="p-6 border-b border-orange-300 bg-gradient-to-br from-orange-600 via-red-500 to-red-600 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
              <ChefHat className="text-white" size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                MakeAFood
              </h2>
              <p className="text-white/80 text-xs font-medium">
                Smart Recipe Generator
              </p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-orange-100 flex-shrink-0">
        <button
          onClick={handleNewRecipe}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-xl hover:scale-[1.01] transition-all text-base font-bold shadow-lg flex items-center justify-center gap-2"
        >
          <Plus size={20} strokeWidth={3} />
          New Recipe Session
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <h3 className="font-black text-gray-800 mb-3 flex items-center gap-2 text-md">
          <History size={20} className="text-orange-500" />
          Recent Ideas
        </h3>
        <div className="space-y-2">
          {chatHistory
            .filter((msg: ChatMessage) => msg.type === "ai")
            .slice(-5)
            .map((item: ChatMessage, index: number) => (
              <div
                key={index}
                className="group p-3 rounded-xl bg-orange-50 hover:bg-orange-100 transition-all cursor-pointer border border-orange-200 hover:border-orange-400 shadow-sm"
              >
                <p className="text-gray-800 font-bold text-xs line-clamp-2 group-hover:text-orange-600 transition-colors">
                  {item.content.replace("Found it! Try: ", "")}
                </p>
              </div>
            ))}
          {chatHistory.filter((msg: ChatMessage) => msg.type === "ai")
            .length === 0 && (
            <div className="text-center py-6">
              <AlertCircle className="mx-auto text-orange-300 mb-2" size={28} />
              <p className="text-gray-500 text-xs font-medium">
                No recipes generated yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default HistorySidebar;
