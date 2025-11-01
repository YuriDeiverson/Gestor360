import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: ReactNode;
}

const Portal: React.FC<PortalProps> = ({ children }) => {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Criar ou encontrar o elemento portal
    let element = document.getElementById("portal-root");

    if (!element) {
      element = document.createElement("div");
      element.id = "portal-root";
      element.className = "modal-portal";
      element.style.position = "fixed";
      element.style.top = "0";
      element.style.left = "0";
      element.style.width = "100%";
      element.style.height = "100%";
      element.style.zIndex = "99999";
      element.style.pointerEvents = "auto";
      document.body.appendChild(element);
    }

    setPortalElement(element);

    // Adicionar classe para bloquear interação
    document.body.classList.add("modal-open");

    // Cleanup - restaurar estilos originais
    return () => {
      document.body.classList.remove("modal-open");

      if (element && element.childElementCount === 0) {
        document.body.removeChild(element);
      }
    };
  }, []);

  if (!portalElement) return null;

  return createPortal(children, portalElement);
};

export default Portal;
