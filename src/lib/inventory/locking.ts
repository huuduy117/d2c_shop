import { pool } from "@/lib/db/client";
import type { InventoryAction } from "@/lib/orders/state-machine";

interface CartItem {
  product_variant_id: string;
  quantity: number;
}

// Pessimistic lock: SELECT ... FOR UPDATE inside a transaction
export async function reserveInventory(
  branchId: string,
  items: CartItem[],
): Promise<{ success: boolean; failedItem?: string }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const item of items) {
      const result = await client.query(
        `SELECT stock, reserved_stock FROM inventory
         WHERE product_variant_id = $1 AND branch_id = $2
         FOR UPDATE`,
        [item.product_variant_id, branchId],
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, failedItem: item.product_variant_id };
      }

      const { stock, reserved_stock } = result.rows[0];
      const available = stock - reserved_stock;

      if (available < item.quantity) {
        await client.query("ROLLBACK");
        return { success: false, failedItem: item.product_variant_id };
      }

      await client.query(
        `UPDATE inventory
         SET reserved_stock = reserved_stock + $1
         WHERE product_variant_id = $2 AND branch_id = $3`,
        [item.quantity, item.product_variant_id, branchId],
      );
    }

    await client.query("COMMIT");
    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Commit reservation: deduct actual stock, release reserved
export async function commitInventory(
  branchId: string,
  items: CartItem[],
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const item of items) {
      await client.query(
        `UPDATE inventory
         SET stock = stock - $1, reserved_stock = reserved_stock - $1
         WHERE product_variant_id = $2 AND branch_id = $3`,
        [item.quantity, item.product_variant_id, branchId],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Release reserved stock (cancel before CONFIRMED)
export async function releaseReservedInventory(
  branchId: string,
  items: CartItem[],
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const item of items) {
      await client.query(
        `UPDATE inventory
         SET reserved_stock = GREATEST(reserved_stock - $1, 0)
         WHERE product_variant_id = $2 AND branch_id = $3`,
        [item.quantity, item.product_variant_id, branchId],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Restore stock (cancel after CONFIRMED, or return refunded)
export async function restoreStock(
  branchId: string,
  items: CartItem[],
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const item of items) {
      await client.query(
        `UPDATE inventory
         SET stock = stock + $1
         WHERE product_variant_id = $2 AND branch_id = $3`,
        [item.quantity, item.product_variant_id, branchId],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Dispatch inventory action based on state machine
export async function handleInventoryAction(
  action: InventoryAction,
  branchId: string,
  items: CartItem[],
): Promise<{ success: boolean; failedItem?: string }> {
  switch (action) {
    case "reserve":
      return reserveInventory(branchId, items);
    case "commit":
      await commitInventory(branchId, items);
      return { success: true };
    case "release_reserved":
      await releaseReservedInventory(branchId, items);
      return { success: true };
    case "restore_stock":
      await restoreStock(branchId, items);
      return { success: true };
    case "none":
      return { success: true };
  }
}
