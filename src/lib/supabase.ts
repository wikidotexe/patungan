import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Bill {
  id: string;
  title: string;
  bill_name: string | null;
  total_bill: number | null;
  enable_service: boolean;
  enable_tax: boolean;
  custom_service: string | null;
  custom_tax: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillPerson {
  id: string;
  bill_id: string;
  person_id: string;
  person_name: string;
  created_at: string;
}

export interface CustomBill {
  id: string;
  title: string;
  enable_service: boolean;
  enable_tax: boolean;
  custom_service: string | null;
  custom_tax: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomBillPerson {
  id: string;
  custom_bill_id: string;
  person_id: string;
  person_name: string;
  created_at: string;
}

export interface CustomBillItem {
  id: string;
  custom_bill_id: string;
  item_id: string;
  item_name: string;
  item_price: number;
  created_at: string;
}

// Simple Split Bill Functions
export async function loadBillFromSupabase(title: string, userEmail: string) {
  try {
    const { data: bill, error: billError } = await supabase
      .from("bills")
      .select("*")
      .eq("title", title)
      .eq("user_email", userEmail)
      .single();

    if (billError) {
      console.warn("⚠️ Bill not found or error:", billError.message);
      return null;
    }

    const { data: people, error: peopleError } = await supabase.from("bill_people").select("*").eq("bill_id", bill.id);

    if (peopleError) {
      console.error("❌ Error loading people:", peopleError);
      return null;
    }

    return { bill, people: people || [] };
  } catch (error) {
    console.error("❌ Error in loadBillFromSupabase:", error);
    return null;
  }
}

export async function saveBillToSupabase(title: string, billName: string, totalBill: string, persons: Array<{ id: string; name: string }>, enableService: boolean, enableTax: boolean, customService: string, customTax: string, userEmail: string) {
  try {
    const { data: existingBill } = await supabase
      .from("bills")
      .select("id")
      .eq("title", title)
      .eq("user_email", userEmail)
      .maybeSingle();

    let bill;
    let billError;

    if (existingBill) {
      const { data: updatedBill, error: updateError } = await supabase
        .from("bills")
        .update({
          bill_name: billName,
          total_bill: totalBill ? parseFloat(totalBill) : null,
          enable_service: enableService,
          enable_tax: enableTax,
          custom_service: customService,
          custom_tax: customTax,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingBill.id)
        .select()
        .single();
      bill = updatedBill;
      billError = updateError;
    } else {
      const { data: newBill, error: insertError } = await supabase
        .from("bills")
        .insert({
          title,
          user_email: userEmail,
          bill_name: billName,
          total_bill: totalBill ? parseFloat(totalBill) : null,
          enable_service: enableService,
          enable_tax: enableTax,
          custom_service: customService,
          custom_tax: customTax,
        })
        .select()
        .single();
      bill = newBill;
      billError = insertError;
    }

    if (billError || !bill) {
      console.error("❌ Error saving bill:", billError);
      return false;
    }

    const { error: deleteError } = await supabase.from("bill_people").delete().eq("bill_id", bill.id);
    if (deleteError) console.warn("⚠️ Warning deleting old people:", deleteError);

    if (persons.length > 0) {
      const { error: peopleError } = await supabase.from("bill_people").insert(
        persons.map((p) => ({ bill_id: bill.id, person_id: p.id, person_name: p.name })),
      );
      if (peopleError) {
        console.error("❌ Error saving people:", peopleError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("❌ Error in saveBillToSupabase:", error);
    return false;
  }
}

export async function deleteBillFromSupabase(title: string, userEmail: string) {
  try {
    const { data: bill } = await supabase
      .from("bills")
      .select("id")
      .eq("title", title)
      .eq("user_email", userEmail)
      .single();

    if (!bill) return false;
    const { error } = await supabase.from("bills").delete().eq("id", bill.id);
    return !error;
  } catch (error) {
    console.error("Error deleting bill:", error);
    return false;
  }
}

// Custom Split Bill Functions
export async function loadCustomBillFromSupabase(title: string, userEmail: string) {
  try {
    const { data: bill, error: billError } = await supabase
      .from("custom_bills")
      .select("*")
      .eq("title", title)
      .eq("user_email", userEmail)
      .single();

    if (billError) {
      console.warn("⚠️ Custom bill not found or error:", billError.message);
      return null;
    }


    const [{ data: people }, { data: items }] = await Promise.all([
      supabase.from("custom_bill_people").select("*").eq("custom_bill_id", bill.id),
      supabase
        .from("custom_bill_items")
        .select(
          `
          id,
          custom_bill_id,
          item_id,
          item_name,
          item_price,
          created_at,
          custom_bill_item_assignments(person_id)
        `,
        )
        .eq("custom_bill_id", bill.id),
    ]);


    return {
      bill,
      people: people || [],
      items:
        items?.map((item) => ({
          ...item,
          assignedTo: (item.custom_bill_item_assignments as any[]).map((a) => a.person_id),
        })) || [],
    };
  } catch (error) {
    console.error("❌ Error loading custom bill:", error);
    return null;
  }
}

export async function saveCustomBillToSupabase(
  title: string,
  persons: Array<{ id: string; name: string }>,
  items: Array<{ id: string; name: string; price: number; assignedTo: string[] }>,
  enableService: boolean,
  enableTax: boolean,
  customService: string,
  customTax: string,
  userEmail: string,
) {
  try {
    const { data: existingBill } = await supabase
      .from("custom_bills")
      .select("id")
      .eq("title", title)
      .eq("user_email", userEmail)
      .maybeSingle();

    let bill;
    let billError;

    if (existingBill) {
      // Update existing bill
      const { data: updatedBill, error: updateError } = await supabase
        .from("custom_bills")
        .update({
          enable_service: enableService,
          enable_tax: enableTax,
          custom_service: customService,
          custom_tax: customTax,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingBill.id)
        .select()
        .single();

      bill = updatedBill;
      billError = updateError;
    } else {
      const { data: newBill, error: insertError } = await supabase
        .from("custom_bills")
        .insert({
          title,
          user_email: userEmail,
          enable_service: enableService,
          enable_tax: enableTax,
          custom_service: customService,
          custom_tax: customTax,
        })
        .select()
        .single();
      bill = newBill;
      billError = insertError;
    }

    // Delete old people first, then insert fresh
    const { error: deletePeopleError } = await supabase.from("custom_bill_people").delete().eq("custom_bill_id", bill.id);
    if (deletePeopleError) {
      console.warn("⚠️ Warning deleting old people:", deletePeopleError);
    }

    // Insert new people
    if (persons.length > 0) {
      const { error: peopleError } = await supabase.from("custom_bill_people").insert(
        persons.map((p) => ({
          custom_bill_id: bill.id,
          person_id: p.id,
          person_name: p.name,
        })),
      );

      if (peopleError) {
        console.error("❌ Error saving people:", peopleError);
        return false;
      }
    }

    // Delete old items and their assignments
    // Must delete assignments FIRST to avoid FK constraint violation
    const { data: oldItems } = await supabase
      .from("custom_bill_items")
      .select("id")
      .eq("custom_bill_id", bill.id);

    if (oldItems && oldItems.length > 0) {
      await supabase
        .from("custom_bill_item_assignments")
        .delete()
        .in("item_id", oldItems.map((i) => i.id));
    }

    const { error: deleteItemsError } = await supabase.from("custom_bill_items").delete().eq("custom_bill_id", bill.id);
    if (deleteItemsError) {
      console.error("❌ Error deleting old items:", deleteItemsError);
      return false;
    }

    // Insert new items and assignments
    if (items.length > 0) {
      for (const item of items) {
        const { data: insertedItem, error: itemError } = await supabase
          .from("custom_bill_items")
          .insert({
            custom_bill_id: bill.id,
            item_id: item.id,
            item_name: item.name,
            item_price: item.price,
          })
          .select()
          .single();

        if (itemError) {
          console.error("❌ Error saving item:", itemError);
          return false;
        }

        if (item.assignedTo.length > 0) {
          const { error: assignmentError } = await supabase.from("custom_bill_item_assignments").insert(
            item.assignedTo.map((personId) => ({
              item_id: insertedItem.id,
              person_id: personId,
            })),
          );

          if (assignmentError) {
            console.error("❌ Error saving assignments:", assignmentError);
            return false;
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error("❌ Error in saveCustomBillToSupabase:", error);
    return false;
  }
}

export async function deleteCustomBillFromSupabase(title: string, userEmail: string) {
  try {
    const { data: bill } = await supabase
      .from("custom_bills")
      .select("id")
      .eq("title", title)
      .eq("user_email", userEmail)
      .single();

    if (!bill) return false;
    const { error } = await supabase.from("custom_bills").delete().eq("id", bill.id);
    return !error;
  } catch (error) {
    console.error("Error deleting custom bill:", error);
    return false;
  }
}

// Get all bills for list view
export async function getAllBillsFromSupabase(userEmail: string) {
  try {
    const { data: bills, error } = await supabase
      .from("bills")
      .select("*")
      .eq("user_email", userEmail)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching bills:", error);
      return [];
    }
    return bills || [];
  } catch (error) {
    console.error("Error in getAllBillsFromSupabase:", error);
    return [];
  }
}

export async function getAllCustomBillsFromSupabase(userEmail: string) {
  try {
    const { data: bills, error } = await supabase
      .from("custom_bills")
      .select("*")
      .eq("user_email", userEmail)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching custom bills:", error);
      return [];
    }
    return bills || [];
  } catch (error) {
    console.error("Error in getAllCustomBillsFromSupabase:", error);
    return [];
  }
}

// ─── User Identity Functions ───────────────────────────────────────────────────

export async function upsertUser(email: string, username: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("users").upsert(
      {
        email,
        username,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    );

    if (error) {
      console.error("❌ Error upserting user:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Error in upsertUser:", error);
    return false;
  }
}

export async function deleteAllDataFromSupabase(): Promise<{ success: boolean; count: number }> {
  try {
    // Delete all bills (cascades to bill_people automatically)
    const { data: bills } = await supabase.from("bills").select("id");
    if (bills && bills.length > 0) {
      await supabase.from("bills").delete().in("id", bills.map((b) => b.id));
    }

    // Delete all custom_bills (cascades to custom_bill_people, custom_bill_items, custom_bill_item_assignments)
    const { data: customBills } = await supabase.from("custom_bills").select("id");
    if (customBills && customBills.length > 0) {
      await supabase.from("custom_bills").delete().in("id", customBills.map((b) => b.id));
    }

    // Delete all notes
    const { error: notesError } = await supabase.from("notes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (notesError) console.warn("⚠️ Error deleting notes:", notesError);

    const count = (bills?.length ?? 0) + (customBills?.length ?? 0);
    return { success: true, count };
  } catch (error) {
    console.error("❌ Error in deleteAllDataFromSupabase:", error);
    return { success: false, count: 0 };
  }
}


// ─── Notes Functions ───────────────────────────────────────────────────────────

export interface NoteRow {
  id: string;
  note_id: string;
  title: string;
  content: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function loadNotesFromSupabase(userEmail: string): Promise<NoteRow[]> {
  try {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_email", userEmail)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("❌ Error loading notes:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("❌ Error in loadNotesFromSupabase:", error);
    return [];
  }
}

export async function saveNoteToSupabase(note: {
  note_id: string;
  title: string;
  content: string;
  sort_order: number;
  user_email: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from("notes").upsert(
      {
        note_id: note.note_id,
        title: note.title,
        content: note.content,
        sort_order: note.sort_order,
        user_email: note.user_email,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "note_id" },
    );

    if (error) {
      console.error("❌ Error saving note:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Error in saveNoteToSupabase:", error);
    return false;
  }
}

export async function deleteNoteFromSupabase(noteId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("notes").delete().eq("note_id", noteId);

    if (error) {
      console.error("❌ Error deleting note:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Error in deleteNoteFromSupabase:", error);
    return false;
  }
}

export async function updateNotesOrderInSupabase(
  notes: Array<{ note_id: string; sort_order: number }>,
): Promise<boolean> {
  try {
    const updates = notes.map((n) =>
      supabase
        .from("notes")
        .update({ sort_order: n.sort_order, updated_at: new Date().toISOString() })
        .eq("note_id", n.note_id),
    );

    await Promise.all(updates);
    return true;
  } catch (error) {
    console.error("❌ Error updating notes order:", error);
    return false;
  }
}

// ─── Chat History Functions ────────────────────────────────────────────────────

export interface ChatMessageRow {
  id: string;
  user_email: string;
  role: "user" | "model";
  content: string;
  created_at: string;
}

export async function loadChatHistoryFromSupabase(userEmail: string): Promise<ChatMessageRow[]> {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_email", userEmail)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Error loading chat history:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("❌ Error in loadChatHistoryFromSupabase:", error);
    return [];
  }
}

export async function appendChatMessageToSupabase(
  userEmail: string,
  role: "user" | "model",
  content: string,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("chat_messages").insert({
      user_email: userEmail,
      role,
      content,
    });

    if (error) {
      console.error("❌ Error appending chat message:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Error in appendChatMessageToSupabase:", error);
    return false;
  }
}

export async function clearChatHistoryFromSupabase(userEmail: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("chat_messages").delete().eq("user_email", userEmail);

    if (error) {
      console.error("❌ Error clearing chat history:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Error in clearChatHistoryFromSupabase:", error);
    return false;
  }
}
