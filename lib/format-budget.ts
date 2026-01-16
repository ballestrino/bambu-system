
interface BudgetOption {
    has_products: boolean;
    price: number;
    iva: number;
    products_price?: number;
    visits?: number;
    visit_type?: string;
    hours_per_visit?: number;
}

interface BudgetContext {
    name?: string;
    description?: string;
    budgetOptions?: BudgetOption[];
    price?: number;
    iva?: number;
    products_price?: number;
    has_products?: boolean;
    visits?: number;
    visit_type?: string;
    hours_per_visit?: number;
    [key: string]: any;
}

function formatScope(visits?: number, visitType?: string, hours?: number): string {
    if (!visits || !visitType || !hours) return "No especificado";
    
    const typeMap: Record<string, string> = {
        'week': 'semana',
        'month': 'mes',
        'days': 'días puntuales'
    };
    
    const translatedType = typeMap[visitType] || visitType;
    const frequency = visits === 1 ? `1 vez por ${translatedType}` : `${visits} veces por ${translatedType}`;
    
    return `${frequency}, ${hours} horas por visita.`;
}

export function formatBudgetForAI(budget: BudgetContext): string {
    if (!budget) return "No hay información del presupuesto disponible.";

    let optionsText = "";
    let scopeText = "";

    // Helper to calculate prices from Total + Rate
    const calculatePrices = (totalPrice: number, ivaRate: number) => {
        // If ivaRate is 22, divisor is 1.22
        const divisor = 1 + (ivaRate / 100);
        const priceNoIva = totalPrice / divisor;
        const ivaAmount = totalPrice - priceNoIva;
        return { priceNoIva, ivaAmount, totalPrice };
    };

    if (Array.isArray(budget.budgetOptions) && budget.budgetOptions.length > 0) {
        // Assume scope is similar across options or take from the first one as representative
        // (In this domain, products usually don't change the visit frequency)
        const firstOpt = budget.budgetOptions[0];
        scopeText = formatScope(firstOpt.visits, firstOpt.visit_type, firstOpt.hours_per_visit);
        
        optionsText = budget.budgetOptions.map((opt, index) => {
            const type = opt.has_products ? "Con Productos" : "Sin Productos";
            
            // `opt.price` is the Final Price (Con IVA)
            // `opt.iva` is the Rate (e.g. 22)
            const rawPrice = Number(opt.price || 0);
            const rawIvaRate = Number(opt.iva || 0);
            
            const { priceNoIva, ivaAmount, totalPrice } = calculatePrices(rawPrice, rawIvaRate);

            return `   OPCIÓN ${index + 1} - ${type}:
     - Precio SIN IVA: $${priceNoIva.toFixed(2)}
     - Monto IVA (${rawIvaRate}%): $${ivaAmount.toFixed(2)}
     - Precio FINAL (Con IVA): $${totalPrice.toFixed(2)}`;
        }).join('\n\n');
    } 
    else {
        scopeText = formatScope(budget.visits, budget.visit_type, budget.hours_per_visit);
        
        // Form Data case: `price` is Final Price. `iva` is Rate.
        const rawPrice = Number(budget.price || 0);
        const rawIvaRate = Number(budget.iva || 0);
        
        const { priceNoIva, ivaAmount, totalPrice } = calculatePrices(rawPrice, rawIvaRate);
        
        const hasProducts = Number(budget.products_price || 0) > 0;
        const type = hasProducts ? "Con Productos (Según configuración actual)" : "Sin Productos (Según configuración actual)";

        optionsText = `   CONFIGURACIÓN ACTUAL DEL FORMULARIO (${type}):
     - Precio SIN IVA: $${priceNoIva.toFixed(2)}
     - Monto IVA (${rawIvaRate}%): $${ivaAmount.toFixed(2)}
     - Precio FINAL (Con IVA): $${totalPrice.toFixed(2)}`;
    }

    return `
INFORMACIÓN DETALLADA DEL PRESUPUESTO:

Nombre del Servicio: ${budget.name || 'Sin nombre'}
Descripción: ${budget.description || 'Sin descripción'}

DETALLE DEL ALCANCE (Horarios y Frecuencia):
${scopeText}

DETALLE DE PRECIOS:
${optionsText}

NOTAS PARA EL ASISTENTE:
- Si hay "Sin Productos" y "Con Productos", ofrece ambas opciones.
- Si solo hay una opción (ej. desde el formulario), presenta esa única opción claramente.
- Recuerda siempre incluir la nota sobre "Literal E" al final de los precios.
`.trim();
}
