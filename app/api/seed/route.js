import { NextResponse } from 'next/server';
import { seedCategories, seedProducts } from '@/lib/data/seedData';
import { createDocument, getAllDocuments } from '@/lib/firebase/firestore';

export async function POST(request) {
    try {
        const results = {
            categories: { created: 0, skipped: 0 },
            products: { created: 0, skipped: 0 },
            errors: [],
        };

        // Check if seeding is needed
        const { data: existingCategories } = await getAllDocuments('categories');
        const { data: existingProducts } = await getAllDocuments('products');

        if (existingCategories?.length > 0 || existingProducts?.length > 0) {
            return NextResponse.json({
                success: false,
                message: 'Database already contains data. Clear existing data first.',
                results,
            }, { status: 400 });
        }

        // Seed categories
        const categoryMap = {};
        for (const category of seedCategories) {
            try {
                const { id } = await createDocument('categories', {
                    ...category,
                    createdAt: new Date().toISOString(),
                });
                categoryMap[category.name] = id;
                results.categories.created++;
            } catch (error) {
                results.errors.push(`Category ${category.name}: ${error.message}`);
                results.categories.skipped++;
            }
        }

        // Seed products
        for (const product of seedProducts) {
            try {
                await createDocument('products', {
                    ...product,
                    categoryId: categoryMap[product.category],
                    createdAt: new Date().toISOString(),
                });
                results.products.created++;
            } catch (error) {
                results.errors.push(`Product ${product.name}: ${error.message}`);
                results.products.skipped++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Successfully seeded ${results.categories.created} categories and ${results.products.created} products!`,
            results,
        });
    } catch (error) {
        console.error('Seeding error:', error);
        return NextResponse.json(
            { error: error.message || 'Seeding failed' },
            { status: 500 }
        );
    }
}
