import { ChevronRight } from "lucide-react";

type PageType = 'myproject' | 'liked' | 'detail' | 'editor' | 'settings';

interface BreadcrumbItem {
  label: string;
  page: PageType;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (page: PageType) => void;
}

export default function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
            )}
            
            {isLast ? (
              <span className="text-gray-900 font-medium">
                {item.label}
              </span>
            ) : (
              <button
                onClick={() => onNavigate(item.page)}
                className="text-gray-500 hover:text-gray-900 transition-colors duration-200"
              >
                {item.label}
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}