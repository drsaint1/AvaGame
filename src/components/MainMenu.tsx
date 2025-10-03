import React from "react";
import { useAccount } from "wagmi";

interface MainMenuProps {
  onSelectShip: () => void;
  onBuyShip: () => void;
  onDailyChallenge: () => void;
  onTournaments: () => void;
  onPracticeFight: () => void;
  onStakeManager: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({
  onSelectShip,
  onBuyShip,
  onDailyChallenge,
  onTournaments,
  onPracticeFight,
  onStakeManager,
}) => {
  const { isConnected } = useAccount();

  const menuItems = [
    {
      title: "Select Ship",
      description: "Choose your spaceship and launch into combat missions",
      onClick: onSelectShip,
      icon: "🚀",
      gradient: "from-emerald-400 to-cyan-400",
      hoverGradient: "from-emerald-500 to-cyan-500",
      available: true,
      category: "Combat",
    },
    {
      title: "Practice Fight",
      description: "Train your combat skills in risk-free practice mode",
      onClick: onPracticeFight,
      icon: "🎯",
      gradient: "from-blue-400 to-indigo-400",
      hoverGradient: "from-blue-500 to-indigo-500",
      available: true,
      category: "Training",
    },
    {
      title: "Buy Ships",
      description: "Purchase powerful spaceships to expand your fleet",
      onClick: onBuyShip,
      icon: "🛒",
      gradient: "from-yellow-400 to-orange-400",
      hoverGradient: "from-yellow-500 to-orange-500",
      available: isConnected,
      category: "Store",
    },
    {
      title: "Stake Manager",
      description: "Stake ships to earn passive AVAX rewards",
      onClick: onStakeManager,
      icon: "🔒",
      gradient: "from-orange-400 to-red-400",
      hoverGradient: "from-orange-500 to-red-500",
      available: isConnected,
      category: "Earn",
    },
    {
      title: "Daily Challenge",
      description: "Complete special missions for bonus rewards",
      onClick: onDailyChallenge,
      icon: "⚡",
      gradient: "from-pink-400 to-rose-400",
      hoverGradient: "from-pink-500 to-rose-500",
      available: true,
      category: "Missions",
    },
    {
      title: "Tournaments",
      description: "Compete against other players for exclusive prizes",
      onClick: onTournaments,
      icon: "🏆",
      gradient: "from-purple-400 to-violet-400",
      hoverGradient: "from-purple-500 to-violet-500",
      available: true,
      category: "Compete",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Stars background */}
      <div className="absolute inset-0 opacity-50">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen p-2 py-4">
        {/* Header */}
        <div className="text-center mb-4 max-w-4xl">
          <h1 className="font-space text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 animate-glow">
            SPACE FLEET COMMAND
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-1 text-xs sm:text-sm text-gray-300 mb-3">
            <span className="animate-pulse">🌌</span>
            <span className="font-game">Battle • Collect • Dominate</span>
            <span className="animate-pulse">✨</span>
          </div>
          <div className="inline-flex items-center px-3 py-1 bg-gray-800/50 rounded-full border border-gray-700/50 backdrop-blur-sm">
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-xs font-medium text-gray-300">
              {isConnected ? 'Wallet Connected' : 'Wallet Disconnected'}
            </span>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl w-full mb-4">
          {menuItems.map((item, index) => (
            <div
              key={index}
              onClick={item.available ? item.onClick : undefined}
              className={`group relative overflow-hidden rounded-2xl transition-all duration-500 ${
                item.available
                  ? 'cursor-pointer hover:scale-[1.05] hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-2'
                  : 'cursor-not-allowed opacity-60'
              }`}
            >
              {/* Main card container */}
              <div className={`relative bg-white/10 backdrop-blur-xl border-2 ${
                item.available
                  ? 'border-white/20 group-hover:border-white/40 group-hover:bg-white/15'
                  : 'border-gray-600/30'
              } rounded-2xl overflow-hidden transition-all duration-500`}>

                {/* Top colored accent */}
                <div className={`h-1.5 bg-gradient-to-r ${item.available ? item.gradient : 'from-gray-600 to-gray-700'} transition-all duration-500 ${item.available ? 'group-hover:h-2' : ''}`}></div>

                {/* Card content */}
                <div className="p-3">
                  {/* Header section */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      {/* Category badge */}
                      <div className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold mb-2 ${
                        item.available
                          ? 'bg-white/15 text-white border border-white/20'
                          : 'bg-gray-700/50 text-gray-400 border border-gray-600/30'
                      }`}>
                        {item.category}
                      </div>

                      {/* Title */}
                      <h3 className={`text-lg font-bold mb-1 ${
                        item.available
                          ? 'text-white'
                          : 'text-gray-400'
                      }`}>
                        {item.title}
                      </h3>
                    </div>

                    {/* Icon */}
                    <div className={`text-3xl ml-3 transform transition-all duration-300 ${
                      item.available ? 'group-hover:scale-110 group-hover:rotate-6' : ''
                    }`}>
                      {item.icon}
                    </div>
                  </div>

                  {/* Description */}
                  <p className={`text-xs leading-relaxed mb-3 ${
                    item.available ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {item.description}
                  </p>

                  {/* Status section */}
                  <div className="flex items-center justify-between">
                    {/* Status indicator */}
                    <div className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${
                      item.available
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                        item.available ? 'bg-emerald-400' : 'bg-red-400'
                      } ${item.available ? 'animate-pulse' : ''}`}></div>
                      {item.available ? 'Ready' : 'Locked'}
                    </div>

                    {/* Click indicator */}
                    {item.available && (
                      <div className="flex items-center text-gray-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span>Click to access</span>
                        <svg className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}

                    {/* Unavailable message */}
                    {!item.available && (
                      <div className="flex items-center text-amber-400 text-xs font-medium">
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-2 animate-pulse"></div>
                        {item.title.includes("Buy Ships") ? "Connect Wallet" : "Unavailable"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Beautiful hover effects */}
                {item.available && (
                  <>
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>

                    {/* Glow overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none`}></div>

                    {/* Border glow */}
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-30 blur-sm -z-10 transition-opacity duration-500 pointer-events-none`}></div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom info */}
        <div className="text-center space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">
            <span>Space Fleet v2.0</span>
            <span>•</span>
            <span>Avalanche Network</span>
            <span>•</span>
            <span>Web3 Powered</span>
          </div>

          {!isConnected && (
            <div className="flex flex-wrap items-center justify-center gap-1 text-amber-400 text-xs animate-pulse px-2 py-1">
              <span>⚠️</span>
              <span>Connect wallet for full features</span>
            </div>
          )}
        </div>
      </div>

      {/* Additional CSS for custom animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(139, 92, 246, 0.5)); }
          50% { filter: drop-shadow(0 0 40px rgba(139, 92, 246, 0.8)); }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MainMenu;