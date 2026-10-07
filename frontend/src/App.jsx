import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/pages/home/Home';
import Pregnants from './components/pages/pregnants/Pregnants';
import Products from './components/pages/products/Products';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/gestante" element={<Pregnants />} />
        <Route path="/produtos" element={<Products />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
