// src/components/shared/AppBreadcrumbs.tsx
'use client';

import { Breadcrumbs, Link, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

interface Crumb {
  label: string;
  href?: string; // se não tiver, significa que é o último item
  icon?: IconProp;
}

interface AppBreadcrumbsProps {
  items: Crumb[];
}

export default function AppBreadcrumbs({ items }: AppBreadcrumbsProps) {
  const router = useRouter();

  const handleClick = (href: string) => {
    router.push(href);
  };

  return (
    <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (isLast || !item.href) {
          return (
            <Typography
              key={index}
              color="text.primary"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              {item.icon && <FontAwesomeIcon icon={item.icon} />}
              {item.label}
            </Typography>
          );
        }

        return (
          <Link
            key={index}
            color="inherit"
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
            onClick={() => handleClick(item.href!)}
          >
            {item.icon && <FontAwesomeIcon icon={item.icon} />}
            {item.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
