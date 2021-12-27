import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const _carts = [...cart];
      const isThereProduct = _carts.find(product => product.id === productId);

      const stocks = await api.get(`stock/${productId}`);

      const stockAmount = stocks.data.amount;
      const currentAmount = isThereProduct ? isThereProduct.amount : 0;
      const amount = currentAmount + 1;

      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(isThereProduct) {
        isThereProduct.amount = amount;
      } else {
        const product = await api.get(`/products/${productId}`);
        const newProduct = {
          ...product.data,
          amount: 1
        };

        _carts.push(newProduct);
      }

      setCart(_carts);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(_carts));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const _carts = [...cart];
      const isThereProductIndex = _carts.findIndex(product => product.id === productId);

      if(isThereProductIndex >= 0) {
        _carts.splice(isThereProductIndex, 1);
        setCart(_carts);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(_carts));
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0) return;

      const stocks = await api.get(`stock/${productId}`);
      const stockAmount = stocks.data.amount;
      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const _carts = [...cart];
      const isThereProduct = _carts.find(product => product.id === productId);
      if(isThereProduct) {
        isThereProduct.amount = amount;
        setCart(_carts);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(_carts));
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
