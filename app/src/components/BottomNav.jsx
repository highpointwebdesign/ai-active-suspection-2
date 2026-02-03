import './BottomNav.css';

function BottomNav({ currentPage, onNavigate, onSettings }) {
  return (
    <nav className="bottom-nav">
      <button 
        className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
        onClick={() => onNavigate('dashboard')}
        title="Dashboard"
      >
        <i class="fa-regular fa-house"></i>
      </button>

      <button 
        className={`nav-item ${currentPage === 'tuning' ? 'active' : ''}`}
        onClick={() => onNavigate('tuning')}
        title="Tuning"
      >
        <i class="fa-solid fa-sliders"></i>
      </button>

      <button 
        className={`nav-item ${currentPage === 'lights' ? 'active' : ''}`}
        onClick={() => onNavigate('lights')}
        title="Lights"
      >
        <i class="fa-regular fa-lightbulb"></i>
      </button>

      <button 
        className={`nav-item ${currentPage === 'fpv' ? 'active' : ''}`}
        onClick={() => onNavigate('fpv')}
        title="FPV"
      >
        <i className="fa-solid fa-glasses"></i>
      </button>

      <button 
        className={`nav-item ${currentPage === 'servo' ? 'active' : ''}`}
        onClick={() => onNavigate('servo')}
        title="Settings"
      >
        <i class="fa-solid fa-gear"></i>
      </button>

      {/* Network settings button moved to header */}
    </nav>
  );
}

export default BottomNav;
