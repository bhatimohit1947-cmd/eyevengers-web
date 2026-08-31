import { supabase } from '../supabaseClient';

async function main() {
  console.log('Starting dummy data cleanup via Supabase JS...');

  try {
    console.log('Deleting Orders...');
    await supabase.from('orders').delete().neq('id', '0');

    console.log('Deleting Cart Items...');
    await supabase.from('cart_items').delete().neq('id', '0');

    console.log('Deleting Wishlists...');
    await supabase.from('wishlists').delete().neq('id', '0');

    console.log('Deleting Addresses...');
    await supabase.from('addresses').delete().neq('id', '0');

    console.log('Deleting Products...');
    await supabase.from('products').delete().neq('id', '0');
    
    // We don't delete Users table here via API easily if it's the auth table,
    // but if there's a public users table we can delete it.
    console.log('Deleting Users...');
    await supabase.from('users').delete().neq('id', '0');

    console.log('Cleanup completed successfully.');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

main();
