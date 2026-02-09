import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './components/Button';
import { Input, Select } from './components/Input';
import { ProductCard } from './components/ProductCard';
import { 
  UserRole, Product, SaleType, ClientStatus, ClientData, UserSession, CartItem, AdminSettings, 
  ProductCategory, Order, Review, Notification 
} from './types';
import { 
  LogOut, User as UserIcon, ShieldAlert, PlusCircle, Monitor, 
  ShoppingBag, X, Info, Home, Smartphone, 
  Settings, Bell, CheckCircle, ArrowRight, ArrowLeft, Save,
  Search, Heart, Clock, Star, Camera, History, Filter,
  Moon, Sun, AlertCircle, Check, AlertTriangle, Lock, Key, Upload, Code
} from 'lucide-react';

// --- CONSTANTS ---
const ADMIN_NAME_SECRET = "Dário Oliveira Pinto";
const DEV_NAME = "Celcio Pinto";
const APP_VERSION = "1.0.0";

const STORAGE_KEY_PRODUCTS = "dario_sabores_products";
const STORAGE_KEY_CLIENTS = "dario_sabores_clients";
const STORAGE_KEY_LAST_USER = "dario_sabores_last_user";
const STORAGE_KEY_SESSION = "dario_sabores_session";
const STORAGE_KEY_CART = "dario_sabores_cart";
const STORAGE_KEY_ADMIN_SETTINGS = "dario_sabores_admin_settings";
const STORAGE_KEY_ORDERS = "dario_sabores_orders";
const STORAGE_KEY_REVIEWS = "dario_sabores_reviews";
const STORAGE_KEY_NOTIFICATIONS = "dario_sabores_notifications";
const STORAGE_KEY_THEME = "dario_sabores_theme";

// --- TYPES FOR UI ---
interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

// --- GLOBAL CLOCK ---
const LiveClock = ({ dark = false }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <div className={`flex flex-col items-end text-xs font-medium leading-tight ${dark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
      <span className={dark ? 'text-gray-200' : 'text-gray-900 dark:text-gray-100'}>{time.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}</span>
      <span className="text-brand-600 dark:text-brand-400 font-bold">{time.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  );
};

// --- LOADING SCREEN ---
const SplashScreen = () => (
  <div className="fixed inset-0 z-[100] bg-brand-700 flex flex-col items-center justify-center text-white">
     <div className="animate-pulse-fast bg-white/10 p-6 rounded-full backdrop-blur-sm mb-6">
        <ShoppingBag size={64} className="text-white drop-shadow-md" />
     </div>
     <h1 className="text-4xl font-bold tracking-tight animate-fade-in">Dário Sabores</h1>
     <p className="text-brand-200 mt-2 text-sm tracking-widest uppercase animate-slide-in-up">Carregando...</p>
  </div>
);

// --- APP COMPONENT ---
export default function App() {
  // Persistence Helpers
  const getStorage = <T,>(key: string, def: T): T => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; } catch { return def; }
  };

  // --- STATE ---
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState<boolean>(() => getStorage(STORAGE_KEY_THEME, false));
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [session, setSession] = useState<UserSession | null>(() => getStorage(STORAGE_KEY_SESSION, null));
  const [products, setProducts] = useState<Product[]>(() => getStorage(STORAGE_KEY_PRODUCTS, []));
  const [clients, setClients] = useState<ClientData[]>(() => getStorage(STORAGE_KEY_CLIENTS, []));
  const [cart, setCart] = useState<CartItem[]>(() => getStorage(STORAGE_KEY_CART, []));
  const [orders, setOrders] = useState<Order[]>(() => getStorage(STORAGE_KEY_ORDERS, []));
  const [reviews, setReviews] = useState<Review[]>(() => getStorage(STORAGE_KEY_REVIEWS, []));
  const [notifications, setNotifications] = useState<Notification[]>(() => getStorage(STORAGE_KEY_NOTIFICATIONS, [
    {id: '1', title: 'Bem-vindo!', message: 'Aproveite as melhores promoções.', date: Date.now(), read: false, type: 'system'}
  ]));
  
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => getStorage(STORAGE_KEY_ADMIN_SETTINGS, { defaultOwnerName: '', defaultWhatsapp: '', defaultIban: '' }));

  // Navigation & UI State
  const [currentView, setCurrentView] = useState<'home' | 'cart' | 'checkout' | 'about' | 'profile' | 'history' | 'favorites' | 'notifications'>('home');
  const [loginMode, setLoginMode] = useState<'client' | 'admin'>('client');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [ratingModal, setRatingModal] = useState<{isOpen: boolean, product: Product | null}>({isOpen: false, product: null});
  const [tempRating, setTempRating] = useState(5);
  const [tempComment, setTempComment] = useState('');

  // Login Inputs
  const [loginClientName, setLoginClientName] = useState('');
  const [loginClientPass, setLoginClientPass] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loginAdminName, setLoginAdminName] = useState('');

  // Admin Inputs
  const [adminTab, setAdminTab] = useState<'monitor' | 'upload' | 'profile'>('monitor');
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', price: '', ownerName: '', whatsapp: '', iban: '', saleType: SaleType.ESTABLISHMENT, category: ProductCategory.HAMBURGUER, imageFile: null as File | null
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showAdminNotifs, setShowAdminNotifs] = useState(false);

  // --- INITIAL LOADING SIMULATION ---
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // --- DARK MODE EFFECT ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY_THEME, JSON.stringify(darkMode));
  }, [darkMode]);

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session)), [session]);
  useEffect(() => localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(clients)), [clients]);
  useEffect(() => localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders)), [orders]);
  useEffect(() => localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews)), [reviews]);
  useEffect(() => localStorage.setItem(STORAGE_KEY_ADMIN_SETTINGS, JSON.stringify(adminSettings)), [adminSettings]);

  // Load Last User
  useEffect(() => {
    const lastUser = getStorage(STORAGE_KEY_LAST_USER, null);
    if (lastUser) {
      setLoginClientName(lastUser.name || '');
      setLoginClientPass(lastUser.password || '');
      setRememberMe(true);
    }
  }, []);

  // --- TOAST SYSTEM ---
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // --- AUTH LOGIC ---
  const handleClientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginClientName.trim() || !loginClientPass.trim()) return;

    let updatedClients = [...clients];
    const existingClient = updatedClients.find(c => c.name === loginClientName);
    let avatar = existingClient?.avatar;

    if (existingClient) {
       // Simple auth check
       if (existingClient.password && existingClient.password !== loginClientPass) {
         addToast("Senha incorreta. Tente novamente.", 'error');
         return; 
       }
       existingClient.lastLogin = Date.now();
       existingClient.status = ClientStatus.ACTIVE;
       existingClient.password = loginClientPass;
    } else {
       updatedClients.push({ 
         id: crypto.randomUUID(), 
         name: loginClientName, 
         password: loginClientPass,
         lastLogin: Date.now(), 
         status: ClientStatus.ACTIVE,
         favorites: [] 
       });
    }

    setClients(updatedClients);
    setSession({ role: UserRole.CLIENT, name: loginClientName, avatar });
    
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY_LAST_USER, JSON.stringify({ name: loginClientName, password: loginClientPass }));
    } else {
      localStorage.removeItem(STORAGE_KEY_LAST_USER);
    }

    setCurrentView('home');
    
    // Welcome Message
    setTimeout(() => {
      addToast(`Olá, ${loginClientName}! Seja bem-vindo ao Dário Sabores.`, 'success');
    }, 500);
  };

  useEffect(() => {
    if (loginMode === 'admin' && loginAdminName === ADMIN_NAME_SECRET) {
      setSession({ role: UserRole.ADMIN, name: ADMIN_NAME_SECRET });
      setLoginAdminName('');
      addToast("Painel de Administrador desbloqueado.", 'success');
    }
  }, [loginAdminName, loginMode]);

  const handleLogout = () => {
    if (session?.role === UserRole.CLIENT) {
      const updated = clients.map(c => c.name === session.name ? { ...c, status: ClientStatus.OFFLINE } : c);
      setClients(updated);
    }
    setSession(null);
    setCart([]);
    setCurrentView('home');
    setSearchQuery('');
    setAdminTab('monitor');
    addToast("Sessão encerrada.", 'info');
  };

  // --- CLIENT ACTIONS ---
  const getCurrentClient = () => clients.find(c => c.name === session?.name);
  
  const toggleFavorite = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (!session || session.role !== UserRole.CLIENT) return;
    
    const client = getCurrentClient();
    if (!client) return;

    const newFavs = client.favorites.includes(productId) 
      ? client.favorites.filter(id => id !== productId)
      : [...client.favorites, productId];
    
    setClients(clients.map(c => c.id === client.id ? { ...c, favorites: newFavs } : c));
  };

  const handleRateProduct = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setRatingModal({ isOpen: true, product });
  };

  const submitRating = () => {
    if (!ratingModal.product || !session) return;
    const client = getCurrentClient();
    if (!client) return;

    const newReview: Review = {
      id: crypto.randomUUID(),
      productId: ratingModal.product.id,
      clientId: client.id,
      clientName: client.name,
      rating: tempRating,
      comment: tempComment,
      date: Date.now()
    };

    setReviews([...reviews, newReview]);
    setRatingModal({ isOpen: false, product: null });
    setTempComment('');
    setTempRating(5);
    addToast('Obrigado pela sua avaliação!', 'success');
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, cartId: crypto.randomUUID(), quantity: 1 }]);
    }
    addToast(`${product.name} adicionado ao carrinho`, 'success');
  };

  // --- PROFILE UPDATE LOGIC ---
  const handleUpdateProfile = async (newPass: string, newAvatarFile: File | null) => {
    const client = getCurrentClient();
    if (!client) return;
    
    let avatarUrl = client.avatar;

    if (newAvatarFile) {
        // Basic Check for size (approx 2MB limit for localStorage safety)
        if (newAvatarFile.size > 2 * 1024 * 1024) {
            addToast('Imagem muito grande! Use uma imagem menor que 2MB.', 'error');
            return;
        }

       try {
         avatarUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(newAvatarFile);
         });
       } catch (err) {
         addToast('Erro ao ler a imagem.', 'error');
         return;
       }
    }

    const updatedClientData = { 
        ...client, 
        password: newPass ? newPass : client.password, 
        avatar: avatarUrl 
    };

    setClients(clients.map(c => c.id === client.id ? updatedClientData : c));
    
    // Update active session immediately
    if (session) {
        setSession({ ...session, avatar: avatarUrl });
    }

    if (newPass) {
        addToast('Senha atualizada com sucesso!', 'success');
    } else if (newAvatarFile) {
        addToast('Foto de perfil atualizada!', 'success');
    }
  };

  const handleCheckout = () => {
     const client = getCurrentClient();
     if (!client) return;

     const newOrder: Order = {
       id: crypto.randomUUID(),
       clientId: client.id,
       items: [...cart],
       total: cart.reduce((acc, i) => acc + (i.price * i.quantity), 0),
       date: Date.now(),
       status: 'Pendente'
     };

     setOrders([newOrder, ...orders]);
     setCurrentView('checkout');
  };

  // --- FILTER & SEARCH ---
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'Todos' || p.category === selectedCategory;
      if (currentView === 'favorites') {
        const client = getCurrentClient();
        return matchSearch && matchCat && client?.favorites.includes(p.id);
      }
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory, currentView, clients, session]);

  const getProductRating = (pid: string) => {
    const pReviews = reviews.filter(r => r.productId === pid);
    if (pReviews.length === 0) return { avg: 0, count: 0 };
    return {
      avg: pReviews.reduce((a, b) => a + b.rating, 0) / pReviews.length,
      count: pReviews.length
    };
  };

  // --- RENDER HELPERS ---
  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-[90] flex flex-col gap-2 w-full max-w-sm px-4 md:px-0">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border-l-4 animate-slide-in-down bg-white dark:bg-gray-800 dark:text-gray-100 ${
            toast.type === 'success' ? 'border-green-500' : 
            toast.type === 'error' ? 'border-red-500' : 'border-blue-500'
          }`}
        >
          <div className={`mt-0.5 ${
            toast.type === 'success' ? 'text-green-500' : 
            toast.type === 'error' ? 'text-red-500' : 'text-blue-500'
          }`}>
             {toast.type === 'success' ? <CheckCircle size={18}/> : toast.type === 'error' ? <AlertCircle size={18}/> : <Info size={18}/>}
          </div>
          <div>
            <h4 className="text-sm font-bold capitalize">{toast.type === 'info' ? 'Info' : toast.type === 'error' ? 'Erro' : 'Sucesso'}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-tight">{toast.message}</p>
          </div>
          <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-white"><X size={14}/></button>
        </div>
      ))}
    </div>
  );

  const DarkModeToggle = () => (
    <button 
      onClick={() => setDarkMode(!darkMode)} 
      className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title="Alternar tema"
    >
      {darkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );

  // --- VIEWS ---
  const LoginView = () => (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-4 right-4 z-20"><DarkModeToggle /></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 dark:bg-brand-950/30 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-50 dark:bg-brand-950/30 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 opacity-50 pointer-events-none"></div>

      <div className="w-full max-w-[360px] relative z-10">
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl shadow-lg shadow-brand-200 dark:shadow-none mb-4 transform rotate-3">
             <ShoppingBag size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Dário Sabores</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Sabor autêntico, entrega rápida.</p>
        </div>

        <div className="relative min-h-[350px]">
          {loginMode === 'client' && (
            <div className="animate-slide-in-up absolute inset-0 w-full">
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-xl p-8">
                 <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                   <UserIcon size={20} className="text-brand-600"/> Área do Cliente
                 </h2>
                 <form onSubmit={handleClientLogin} className="space-y-5">
                    <Input icon={UserIcon} placeholder="Seu nome" value={loginClientName} onChange={e => setLoginClientName(e.target.value)} required className="h-12"/>
                    <Input icon={Lock} type="password" placeholder="Senha" value={loginClientPass} onChange={e => setLoginClientPass(e.target.value)} required className="h-12"/>
                    
                    <div className="flex items-center gap-2">
                       <div className="relative flex items-center">
                          <input 
                            type="checkbox" 
                            id="remember"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 checked:bg-brand-600 checked:border-brand-600 transition-all"
                          />
                          <Check size={12} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" />
                       </div>
                       <label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">Lembrar-me</label>
                    </div>

                    <Button type="submit" fullWidth className="h-12 text-base font-semibold shadow-md shadow-brand-200 dark:shadow-none hover:shadow-lg hover:shadow-brand-300 dark:hover:shadow-brand-900 transition-all">Entrar</Button>
                 </form>
                 <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-800 text-center">
                    <button onClick={() => setLoginMode('admin')} className="text-xs text-gray-400 hover:text-brand-600 font-medium transition-colors flex items-center justify-center gap-1 mx-auto"><ShieldAlert size={14} /> Acesso Administrativo</button>
                 </div>
              </div>
            </div>
          )}

          {loginMode === 'admin' && (
            <div className="animate-slide-in-up absolute inset-0 w-full">
              <div className="bg-gray-900 dark:bg-black rounded-3xl shadow-xl p-8 text-white relative overflow-hidden border border-gray-800">
                 <div className="absolute -top-10 -right-10 w-32 h-32 bg-gray-800 rounded-full blur-2xl opacity-50"></div>
                 <h2 className="text-lg font-bold mb-6 flex items-center gap-2 relative z-10"><ShieldAlert size={20} className="text-brand-500"/> Área Restrita</h2>
                 <div className="space-y-6 relative z-10">
                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                      <label className="text-xs text-gray-400 block mb-2 uppercase tracking-wider font-bold">Nome do Administrador</label>
                      <input type="text" className="w-full bg-transparent border-b border-gray-600 text-white pb-2 focus:outline-none focus:border-brand-500 transition-colors placeholder-gray-600" placeholder="Digite o nome exato" value={loginAdminName} onChange={e => setLoginAdminName(e.target.value)} autoFocus />
                    </div>
                 </div>
                 <div className="mt-8 pt-6 border-t border-gray-800 text-center relative z-10">
                    <button onClick={() => setLoginMode('client')} className="text-xs text-gray-400 hover:text-white font-medium transition-colors flex items-center justify-center gap-1 mx-auto"><ArrowLeft size={14} /> Voltar para Cliente</button>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ClientView = () => {
     const client = getCurrentClient();
     return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24 md:pb-0 transition-colors duration-500">
      {/* RATING MODAL */}
      {ratingModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-xs shadow-2xl">
              <div className="text-center mb-4">
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white">Avaliar Produto</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400">{ratingModal.product?.name}</p>
              </div>
              <div className="flex justify-center gap-2 mb-6">
                 {[1, 2, 3, 4, 5].map(star => (
                   <button key={star} onClick={() => setTempRating(star)} className="transition-transform hover:scale-110">
                     <Star size={32} className={star <= tempRating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 dark:text-gray-700"} />
                   </button>
                 ))}
              </div>
              <textarea placeholder="Comentário (opcional)" className="w-full bg-gray-50 dark:bg-gray-800 dark:text-white rounded-xl p-3 text-sm mb-4 outline-none focus:ring-2 focus:ring-brand-500" rows={3} value={tempComment} onChange={e => setTempComment(e.target.value)} />
              <div className="flex gap-2">
                 <Button variant="secondary" fullWidth onClick={() => setRatingModal({isOpen: false, product: null})}>Cancelar</Button>
                 <Button fullWidth onClick={submitRating}>Enviar</Button>
              </div>
           </div>
        </div>
      )}

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 z-50 px-2 py-3 flex justify-around items-center shadow-2xl">
        <button onClick={() => { setCurrentView('home'); setSelectedCategory('Todos'); }} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentView === 'home' ? 'text-brand-600 bg-brand-50 dark:bg-brand-900/20 dark:text-brand-400' : 'text-gray-400 dark:text-gray-600'}`}>
           <Home size={20}/> <span className="text-[10px] font-medium">Início</span>
        </button>
        <button onClick={() => setCurrentView('favorites')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentView === 'favorites' ? 'text-brand-600 bg-brand-50 dark:bg-brand-900/20 dark:text-brand-400' : 'text-gray-400 dark:text-gray-600'}`}>
           <Heart size={20}/> <span className="text-[10px] font-medium">Favoritos</span>
        </button>
        <button onClick={() => setCurrentView('cart')} className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentView === 'cart' ? 'text-brand-600 bg-brand-50 dark:bg-brand-900/20 dark:text-brand-400' : 'text-gray-400 dark:text-gray-600'}`}>
           <div className="relative"><ShoppingBag size={20}/>{cart.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-500 rounded-full"></span>}</div>
           <span className="text-[10px] font-medium">Carrinho</span>
        </button>
        <button onClick={() => setCurrentView('history')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentView === 'history' ? 'text-brand-600 bg-brand-50 dark:bg-brand-900/20 dark:text-brand-400' : 'text-gray-400 dark:text-gray-600'}`}>
           <History size={20}/> <span className="text-[10px] font-medium">Pedidos</span>
        </button>
        <button onClick={() => setCurrentView('profile')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${currentView === 'profile' ? 'text-brand-600 bg-brand-50 dark:bg-brand-900/20 dark:text-brand-400' : 'text-gray-400 dark:text-gray-600'}`}>
           {session?.avatar ? <img src={session.avatar} className="w-5 h-5 rounded-full object-cover"/> : <UserIcon size={20}/>}
           <span className="text-[10px] font-medium">Perfil</span>
        </button>
      </nav>

      {/* Header */}
      <header className="bg-white dark:bg-gray-900 sticky top-0 z-40 border-b border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
         <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
               <div className="bg-brand-600 text-white p-1.5 rounded-lg"><ShoppingBag size={18} /></div>
               <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white hidden sm:block">Dário<span className="text-brand-600 dark:text-brand-400">Sabores</span></span>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-4 relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <input 
                 type="text" 
                 placeholder="Pesquisar..." 
                 className="w-full bg-gray-100 dark:bg-gray-800 dark:text-white rounded-full pl-10 pr-4 py-2 text-sm focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                 value={searchQuery}
                 onChange={e => { setSearchQuery(e.target.value); setCurrentView('home'); }}
               />
            </div>

            <div className="flex items-center gap-3">
              <DarkModeToggle />
              <button onClick={() => setCurrentView('notifications')} className="relative text-gray-400 hover:text-brand-600 dark:hover:text-brand-400">
                <Bell size={20} />
                {notifications.some(n => !n.read) && <span className="absolute top-0 right-0 w-2 h-2 bg-brand-500 rounded-full border border-white dark:border-gray-900"></span>}
              </button>
              <div className="hidden md:block"><LiveClock dark={darkMode}/></div>
            </div>
         </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {/* VIEW: HOME & FAVORITES */}
        {(currentView === 'home' || currentView === 'favorites') && (
          <div className="space-y-6 animate-fade-in">
            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
               {['Todos', ...Object.values(ProductCategory)].map(cat => (
                 <button 
                   key={cat} 
                   onClick={() => setSelectedCategory(cat)}
                   className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${selectedCategory === cat ? 'bg-brand-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                 >
                   {cat}
                 </button>
               ))}
            </div>

            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                 {currentView === 'favorites' ? <><Heart size={20} className="text-red-500" fill="currentColor"/> Meus Favoritos</> : 'Cardápio'}
              </h2>
              <span className="text-xs font-medium text-gray-400">{filteredProducts.length} itens</span>
            </div>

            {filteredProducts.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-gray-300 dark:text-gray-600">
                  <Search size={48} strokeWidth={1} />
                  <p className="mt-4 text-sm font-medium">Nenhum produto encontrado.</p>
                  {currentView === 'favorites' && <Button variant="ghost" onClick={() => setCurrentView('home')} className="mt-2">Ver tudo</Button>}
               </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(p => {
                  const rating = getProductRating(p.id);
                  return (
                    <ProductCard 
                      key={p.id} 
                      product={p} 
                      isFavorite={client?.favorites.includes(p.id) || false}
                      averageRating={rating.avg}
                      reviewCount={rating.count}
                      onClick={addToCart} 
                      onToggleFavorite={toggleFavorite}
                      onRate={handleRateProduct}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW: HISTORY */}
        {currentView === 'history' && (
           <div className="max-w-xl mx-auto animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><History /> Histórico de Pedidos</h2>
              <div className="space-y-4">
                 {orders.filter(o => o.clientId === client?.id).sort((a,b) => b.date - a.date).map(order => (
                    <div key={order.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                       <div className="flex justify-between items-start mb-3">
                          <div>
                             <span className="text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-900/30 dark:text-brand-400 px-2 py-1 rounded-md">#{order.id.slice(0,6)}</span>
                             <p className="text-xs text-gray-400 mt-1">{new Date(order.date).toLocaleString('pt-PT')}</p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${order.status === 'Concluído' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>{order.status}</span>
                       </div>
                       <div className="space-y-1 mb-3">
                          {order.items.map(item => (
                             <div key={item.cartId} className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">{item.quantity}x {item.name}</span>
                                <span className="font-medium text-gray-900 dark:text-gray-200">{(item.price * item.quantity).toLocaleString()} Kz</span>
                             </div>
                          ))}
                       </div>
                       <div className="border-t border-gray-50 dark:border-gray-800 pt-3 flex justify-between items-center">
                          <span className="text-sm text-gray-500">Total</span>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">{order.total.toLocaleString()} Kz</span>
                       </div>
                    </div>
                 ))}
                 {orders.filter(o => o.clientId === client?.id).length === 0 && (
                    <p className="text-center text-gray-400 py-10">Você ainda não fez pedidos.</p>
                 )}
              </div>
           </div>
        )}

        {/* VIEW: NOTIFICATIONS */}
        {currentView === 'notifications' && (
           <div className="max-w-lg mx-auto animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><Bell /> Notificações</h2>
              <div className="space-y-3">
                 {notifications.sort((a,b) => b.date - a.date).map(n => (
                    <div key={n.id} className={`bg-white dark:bg-gray-900 p-4 rounded-xl border ${n.read ? 'border-gray-100 dark:border-gray-800' : 'border-brand-200 dark:border-brand-900 shadow-sm'}`}>
                       <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">{n.title}</h4>
                       <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{n.message}</p>
                       <p className="text-[10px] text-gray-300 mt-2 text-right">{new Date(n.date).toLocaleDateString()}</p>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* VIEW: PROFILE */}
        {currentView === 'profile' && client && (
           <div className="max-w-md mx-auto animate-fade-in bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="text-center mb-6">
                 {/* AVATAR UPLOAD SECTION */}
                 <div className="relative inline-block group">
                    <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden border-4 border-white dark:border-gray-700 shadow-xl mx-auto mb-4 relative">
                       {session?.avatar ? (
                          <img src={session.avatar} className="w-full h-full object-cover animate-fade-in" alt="Perfil" />
                       ) : (
                          <UserIcon size={64} className="text-gray-300 dark:text-gray-600 m-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>
                       )}
                    </div>
                    <label className="absolute bottom-2 right-2 bg-brand-600 hover:bg-brand-700 text-white p-2.5 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110 active:scale-95 z-10 flex items-center justify-center" title="Alterar Foto">
                       <Camera size={18} />
                       <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={e => e.target.files && e.target.files[0] && handleUpdateProfile('', e.target.files[0])} 
                       />
                    </label>
                 </div>

                 <h2 className="text-xl font-bold text-gray-900 dark:text-white">{client.name}</h2>
                 <p className="text-xs text-green-500 font-medium bg-green-50 dark:bg-green-900/20 inline-block px-2 py-1 rounded-full mt-1">● Ativo</p>
              </div>

              <div className="space-y-4">
                 <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Key size={12}/> Alterar Senha</h4>
                    <div className="flex gap-2">
                       <Input placeholder="Nova senha" onChange={e => handleUpdateProfile(e.target.value, null)} className="h-10 text-sm" />
                       <Button onClick={() => {}} className="h-10">OK</Button>
                    </div>
                 </div>
                 
                 <Button variant="secondary" fullWidth onClick={() => setCurrentView('about')} className="bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                    <Info size={16} className="mr-2"/> Sobre o Aplicativo
                 </Button>

                 <Button variant="secondary" fullWidth onClick={handleLogout} className="text-red-500 border-red-100 bg-red-50 hover:bg-red-100 hover:text-red-600 dark:bg-red-900/10 dark:border-red-900/30">
                    <LogOut size={16} className="mr-2"/> Sair da Conta
                 </Button>
              </div>
           </div>
        )}

        {/* VIEW: ABOUT */}
        {currentView === 'about' && (
           <div className="max-w-md mx-auto animate-fade-in pt-4">
             <div className="flex items-center gap-2 mb-6 px-2">
               <button onClick={() => setCurrentView('profile')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors">
                  <ArrowLeft size={20}/>
               </button>
               <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sobre</h2>
             </div>
             
             <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-800 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-400 to-brand-600"></div>
                <div className="w-20 h-20 bg-brand-50 dark:bg-brand-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                   <ShoppingBag size={40} className="text-brand-600 dark:text-brand-500" />
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Dário Sabores</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium bg-gray-100 dark:bg-gray-800 inline-block px-3 py-1 rounded-full">v{APP_VERSION}</p>
                
                <div className="space-y-4 text-left">
                   <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><Code size={18}/></div>
                         <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Desenvolvedor</p>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{DEV_NAME}</p>
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg"><Smartphone size={18}/></div>
                         <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Plataformas</p>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Android & iOS</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="mt-8 text-xs text-gray-400">
                   &copy; {new Date().getFullYear()} Dário Sabores. Todos os direitos reservados.
                </div>
             </div>
           </div>
        )}

        {/* VIEW: CART */}
        {currentView === 'cart' && (
           <div className="max-w-lg mx-auto animate-slide-in-up">
              <div className="flex items-center gap-2 mb-6 text-gray-800 dark:text-white">
                 <button onClick={() => setCurrentView('home')} className="text-gray-400 hover:text-brand-600"><ArrowLeft size={20}/></button>
                 <h2 className="text-xl font-bold">Carrinho</h2>
              </div>
              {cart.length === 0 ? <div className="text-center py-12 text-gray-400"><p>Vazio.</p></div> : 
              <div className="space-y-4">
                 {cart.map(item => (
                     <div key={item.cartId} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                           {item.imageUrl && <img src={item.imageUrl} className="w-full h-full object-cover"/>}
                        </div>
                        <div className="flex-1">
                           <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{item.name}</h4>
                           <div className="text-brand-600 dark:text-brand-400 font-bold text-sm mt-1">{(item.price * item.quantity).toLocaleString('pt-PT')} Kz</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <button onClick={() => {const newC = cart.filter(i => i.cartId !== item.cartId); setCart(newC);}} className="text-gray-300 hover:text-red-500"><X size={14}/></button>
                           <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1">
                              <span className="text-xs font-bold dark:text-gray-300">{item.quantity}</span>
                           </div>
                        </div>
                     </div>
                 ))}
                 <div className="h-24"></div>
                 <div className="fixed bottom-20 md:bottom-10 left-0 w-full px-4"><div className="max-w-lg mx-auto bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 flex justify-between items-center"><div><div className="text-xs text-gray-400">Total</div><div className="text-xl font-extrabold text-brand-600 dark:text-brand-400">{cart.reduce((a,b)=>a+(b.price*b.quantity),0).toLocaleString('pt-PT')} Kz</div></div><Button onClick={handleCheckout}>Finalizar</Button></div></div>
              </div>}
           </div>
        )}

        {/* VIEW: CHECKOUT */}
        {currentView === 'checkout' && (
           <div className="max-w-md mx-auto animate-slide-in-up pt-4">
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 text-center border border-gray-100 dark:border-gray-800">
                 <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} /></div>
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pedido Pronto!</h2>
                 <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">O pedido foi salvo no seu histórico. Envie o comprovativo no WhatsApp.</p>
                 <a href={`https://wa.me/${cart[0]?.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(`*Pedido #${orders[0]?.id.slice(0,6)} - Dário Sabores*\nCliente: ${session?.name}\nTotal: ${orders[0]?.total} Kz`)}`} target="_blank" className="block w-full bg-[#25D366] text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"><Smartphone size={20} /> Enviar no WhatsApp</a>
                 <button onClick={() => {setCart([]); setCurrentView('home');}} className="mt-6 text-sm text-gray-400 hover:text-gray-900 dark:hover:text-white">Voltar ao Início</button>
              </div>
           </div>
        )}
      </main>
    </div>
  );}

  const AdminView = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
       <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-gray-900 dark:bg-gray-700 rounded-lg flex items-center justify-center text-white"><ShieldAlert size={16} /></div>
             <span className="font-bold text-gray-900 dark:text-white hidden sm:block">Painel Admin</span>
           </div>
           <div className="flex items-center gap-3">
             <DarkModeToggle />
             <div className="relative">
                <button onClick={() => setShowAdminNotifs(!showAdminNotifs)} className={`p-2 rounded-full transition-colors ${clients.filter(c=>c.status===ClientStatus.ACTIVE).length > 0 ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  <Bell size={20} />
                  {clients.filter(c=>c.status===ClientStatus.ACTIVE).length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-600 border-2 border-white dark:border-gray-900 rounded-full"></span>}
                </button>
                {showAdminNotifs && <div className="absolute right-0 top-12 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-4 z-50"><h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Ativos Agora</h4>{clients.filter(c=>c.status===ClientStatus.ACTIVE).map(c=><div key={c.id} className="text-sm font-medium mb-2 dark:text-gray-200">🟢 {c.name}</div>)}</div>}
             </div>
             <Button variant="ghost" onClick={handleLogout} className="text-xs text-gray-500 hover:text-brand-600">Sair</Button>
           </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-6">
        <div className="flex gap-2 sm:gap-4 mb-6 overflow-x-auto no-scrollbar">
           <button onClick={() => setAdminTab('monitor')} className={`flex-1 p-4 rounded-xl border text-sm font-semibold transition-all ${adminTab === 'monitor' ? 'bg-white dark:bg-gray-800 border-brand-500 text-brand-600 dark:text-brand-400 shadow-sm' : 'bg-transparent text-gray-500 dark:text-gray-400'}`}><Monitor className="inline mr-2" size={16}/> Monitor</button>
           <button onClick={() => setAdminTab('upload')} className={`flex-1 p-4 rounded-xl border text-sm font-semibold transition-all ${adminTab === 'upload' ? 'bg-white dark:bg-gray-800 border-brand-500 text-brand-600 dark:text-brand-400 shadow-sm' : 'bg-transparent text-gray-500 dark:text-gray-400'}`}><PlusCircle className="inline mr-2" size={16}/> Produto</button>
           <button onClick={() => setAdminTab('profile')} className={`flex-1 p-4 rounded-xl border text-sm font-semibold transition-all ${adminTab === 'profile' ? 'bg-white dark:bg-gray-800 border-brand-500 text-brand-600 dark:text-brand-400 shadow-sm' : 'bg-transparent text-gray-500 dark:text-gray-400'}`}><Settings className="inline mr-2" size={16}/> Perfil</button>
        </div>
        {adminTab === 'upload' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 animate-fade-in">
             <form onSubmit={async (e) => {
                e.preventDefault();
                setUploadLoading(true);
                let imageUrl = '';
                if (newProduct.imageFile) {
                   imageUrl = await new Promise<string>(r => {const reader = new FileReader(); reader.onloadend = () => r(reader.result as string); reader.readAsDataURL(newProduct.imageFile!);});
                }
                const newP: Product = { 
                   id: crypto.randomUUID(), ...newProduct, price: parseFloat(newProduct.price), imageUrl, publishedBy: 'Admin', publishedAt: Date.now() 
                };
                setProducts([newP, ...products]);
                // Add notification for all clients
                setNotifications([{id: crypto.randomUUID(), title: 'Novo Produto!', message: `${newP.name} acabou de chegar.`, date: Date.now(), read: false, type: 'promo'}, ...notifications]);
                setUploadLoading(false);
                addToast('Produto publicado com sucesso!', 'success');
             }} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                   <Input label="Nome" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required className="bg-gray-50 dark:bg-gray-700 border-none"/>
                   <Input label="Preço (Kz)" type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} required className="bg-gray-50 dark:bg-gray-700 border-none"/>
                   <div className="grid grid-cols-2 gap-4">
                     <Select label="Categoria" options={Object.values(ProductCategory).map(v => ({label: v, value: v}))} value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value as ProductCategory})} className="bg-gray-50 dark:bg-gray-700 border-none" />
                     <Select label="Tipo" options={[{label: 'Estabelecimento', value: SaleType.ESTABLISHMENT}, {label: 'Encomenda', value: SaleType.DELIVERY}]} value={newProduct.saleType} onChange={e => setNewProduct({...newProduct, saleType: e.target.value as SaleType})} className="bg-gray-50 dark:bg-gray-700 border-none" />
                   </div>
                 </div>
                 <div className="space-y-4">
                   <Input label="Vendedor" value={newProduct.ownerName} onChange={e => setNewProduct({...newProduct, ownerName: e.target.value})} required className="bg-gray-50 dark:bg-gray-700 border-none"/>
                   <Input label="WhatsApp" value={newProduct.whatsapp} onChange={e => setNewProduct({...newProduct, whatsapp: e.target.value})} required className="bg-gray-50 dark:bg-gray-700 border-none"/>
                   <Input label="IBAN" value={newProduct.iban} onChange={e => setNewProduct({...newProduct, iban: e.target.value})} required className="bg-gray-50 dark:bg-gray-700 border-none"/>
                 </div>
               </div>
               <textarea className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" rows={2} value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} placeholder="Descrição..." required />
               <div className="relative border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"><input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && setNewProduct({...newProduct, imageFile: e.target.files[0]})} accept="image/*" required={!newProduct.imageFile} /><span className="text-sm text-brand-600 dark:text-brand-400 font-medium">{newProduct.imageFile ? newProduct.imageFile.name : 'Carregar Foto'}</span></div>
               <Button type="submit" fullWidth disabled={uploadLoading} className="h-12 bg-brand-600 hover:bg-brand-700 text-white font-bold">{uploadLoading ? 'Publicando...' : 'Salvar Produto'}</Button>
             </form>
          </div>
        )}
        {adminTab === 'monitor' && <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden p-6 text-center text-gray-500 dark:text-gray-400">Selecione Monitorização no menu superior. (Tabela simplificada para poupar espaço)</div>}
        {adminTab === 'profile' && <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 text-center"><h3 className="font-bold dark:text-white">Perfil Admin</h3><p className="text-sm dark:text-gray-400">Edite seus dados padrão aqui.</p></div>}
      </main>
    </div>
  );

  if (isLoading) return <SplashScreen />;

  return (
    <>
      <ToastContainer />
      {!session ? <LoginView /> : session.role === UserRole.ADMIN ? <AdminView /> : <ClientView />}
    </>
  );
}