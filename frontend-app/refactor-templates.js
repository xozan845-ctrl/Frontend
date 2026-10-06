const fs = require('fs');
const path = require('path');

const components = [
  'src/app/domains/home/home.component.ts',
  'src/app/domains/home/not-found.component.ts',
  'src/app/domains/cart/components/cart-view/cart-view.component.ts',
  'src/app/domains/cart/components/checkout/checkout.component.ts',
  'src/app/domains/cart/components/confirmation/confirmation.component.ts',
  'src/app/domains/wishlist/wishlist.component.ts',
  'src/app/domains/plans/plans.component.ts',
  'src/app/domains/products/components/product-detail/product-detail.component.ts',
  'src/app/domains/products/components/product-list/product-list.component.ts',
  'src/app/domains/auth/components/login-form/login-form.component.ts',
  'src/app/d/ui/cart-sidebar/cart-sidebar.component.ts',
  'src/app/d/ui/empty-state/empty-state.component.ts',
  'src/app/d/ui/notification/toast.component.ts',
  'src/app/d/ui/quick-view/quick-view-modal.component.ts',
  'src/app/d/ui/pwa-install/pwa-install-banner.component.ts',
  'src/app/d/ui/product-carousel/product-carousel.component.ts',
  'src/app/d/ui/search-autocomplete/search-autocomplete.component.ts',
  'src/app/d/ui/star-rating/star-rating.component.ts',
  'src/app/d/ui/trust-badges/trust-badges.component.ts',
  'src/app/d/ui/image-lightbox/image-lightbox.component.ts',
  'src/app/d/ui/spinner/spinner.ts',
  'src/app/d/ui/skeleton/skeleton-loader.component.ts',
];

components.forEach((file) => {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const baseName = path.basename(file, '.ts');
  const dirName = path.dirname(file);

  // Replace inline template
  // Matches template: `...` or template: '...' or template: "..."
  const templateRegex = /template:\s*(`[\s\S]*?`|'[\s\S]*?'|"[\s\S]*?"),?/g;

  if (templateRegex.test(content)) {
    // Replace only the first occurrence which is in @Component
    let replacedTemplate = false;
    content = content.replace(templateRegex, (match) => {
      if (!replacedTemplate) {
        replacedTemplate = true;
        return `templateUrl: './${baseName}.html',`;
      }
      return match;
    });

    // Remove any comment left behind if we already changed it in the past (like home.component.ts)
    content = content.replace(
      /template: `\n    <!-- Template migrated to inline in (.*?) -->\n  `,/,
      '',
    );
  } else if (content.includes('templateUrl:')) {
    console.log(`Already has templateUrl: ${file}`);
  }

  // Replace inline styles
  const stylesRegex = /styles:\s*\[\s*`[\s\S]*?`\s*\],?/g;
  const hasCssFile = fs.existsSync(path.join(process.cwd(), dirName, `${baseName}.css`));

  if (stylesRegex.test(content)) {
    let replacedStyles = false;
    content = content.replace(stylesRegex, (match) => {
      if (!replacedStyles) {
        replacedStyles = true;
        if (hasCssFile) {
          return `styleUrl: './${baseName}.css',`;
        } else {
          // If no CSS file, just remove styles property or keep it empty
          return `/* No styles */`;
        }
      }
      return match;
    });
  } else if (hasCssFile && !content.includes('styleUrl:')) {
    // inject styleUrl if there's a css file but no styles property
    content = content.replace(
      /templateUrl:(.*?)(,?)/,
      `templateUrl:$1$2\n  styleUrl: './${baseName}.css',`,
    );
  }

  fs.writeFileSync(fullPath, content);
  console.log(`Updated ${file}`);
});
