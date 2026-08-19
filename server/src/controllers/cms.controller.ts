import { Request, Response } from 'express';
import { supabase } from '../supabaseClient';

// GET all pages
export const getPages = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('cms_pages').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
};

// GET single page with its sections
export const getPageWithSections = async (req: Request, res: Response) => {
  const { slug } = req.params;
  try {
    // 1. Get the page
    const { data: pageData, error: pageError } = await supabase
      .from('cms_pages')
      .select('*')
      .eq('slug', slug)
      .single();

    if (pageError || !pageData) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // 2. Get sections for this page
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('cms_sections')
      .select('*')
      .eq('page_id', pageData.id)
      .order('order_index', { ascending: true });

    if (sectionsError) throw sectionsError;

    // Map snake_case to camelCase
    const formattedSections = (sectionsData || []).map(s => ({
      id: s.id,
      pageId: s.page_id,
      sectionType: s.section_type,
      order: s.order_index,
      isVisible: s.is_visible,
      configJson: s.config_json // Supabase JSONB returns parsed object natively in JS
    }));

    res.json({ ...pageData, sections: formattedSections });
  } catch (error) {
    console.error('Error fetching page with sections:', error);
    res.status(500).json({ error: 'Failed to fetch page data' });
  }
};

// PUT update section config
export const updateSection = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { configJson, isVisible, order } = req.body;

  try {
    const updateData: any = {};
    if (configJson !== undefined) updateData.config_json = configJson;
    if (isVisible !== undefined) updateData.is_visible = isVisible;
    if (order !== undefined) updateData.order_index = order;

    const { data, error } = await supabase
      .from('cms_sections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Section not found' });

    res.json({
      id: data.id,
      pageId: data.page_id,
      sectionType: data.section_type,
      order: data.order_index,
      isVisible: data.is_visible,
      configJson: data.config_json
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update section' });
  }
};

// POST add new section
export const createSection = async (req: Request, res: Response) => {
  const { pageId, sectionType, configJson, order } = req.body;

  try {
    // If order is not provided, get the max order
    let newOrder = order;
    if (newOrder === undefined) {
      const { data } = await supabase
        .from('cms_sections')
        .select('order_index')
        .eq('page_id', pageId)
        .order('order_index', { ascending: false })
        .limit(1);
      
      newOrder = data && data.length > 0 ? data[0].order_index + 1 : 1;
    }

    const newSection = {
      id: `sec_${Date.now()}`,
      page_id: pageId,
      section_type: sectionType,
      config_json: configJson || {},
      order_index: newOrder,
      is_visible: true
    };

    const { error } = await supabase.from('cms_sections').insert([newSection]);
    if (error) throw error;

    res.status(201).json({
      id: newSection.id,
      pageId: newSection.page_id,
      sectionType: newSection.section_type,
      order: newSection.order_index,
      isVisible: newSection.is_visible,
      configJson: newSection.config_json
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create section' });
  }
};

// DELETE section
export const deleteSection = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('cms_sections').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Section deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete section' });
  }
};
