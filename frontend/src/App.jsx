import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Pregnants from './components/pages/pregnants/Pregnants';
import Products from './components/pages/products/Products';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/gestante" element={<Pregnants />} />
        <Route path="/" element={<Products />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
