import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/pages/home/Home';
import ModulePage from './components/pages/modules/ModulePage';
import Pregnants from './components/pages/pregnants/Pregnants';
import Products from './components/pages/products/Products';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/gestante" element={<Pregnants />} />
        <Route path="/produtos" element={<Products />} />
        <Route path="/colaboradores" element={<ModulePage module="colaboradores" />} />
        <Route path="/doacoes" element={<ModulePage module="doacoes" />} />
        <Route path="/estoque" element={<ModulePage module="estoque" />} />
        <Route path="/fila-prioridade" element={<ModulePage module="fila" />} />
        <Route path="/kits" element={<ModulePage module="kits" />} />
        <Route path="/triagem" element={<ModulePage module="triagem" />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
