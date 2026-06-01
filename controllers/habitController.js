import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";

// @desc    Get all habits for current user
// @route   GET /api/habits
export const getHabits = async (req, res) => {
  try {
    const { includeArchived } = req.query;
    const filter = { userId: req.user._id };
    
    if (includeArchived !== "true") filter.isArchived = false;

    const habits = await Habit.find(filter).sort({ order: 1, createdAt: 1 });
    res.json(habits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create a new habit
// @route   POST /api/habits
export const createHabit = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      frequency,
      targetDays,
      color,
      icon,
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Habit name is required" });
    }

    const count = await Habit.countDocuments({ userId: req.user._id });
    
    const habit = await Habit.create({
      userId: req.user._id,
      name,
      description,
      category,
      frequency,
      targetDays,
      color,
      icon,
      order: count,
    });

    res.status(201).json(habit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update a habit by ID
// @route   PUT /api/habits/:id
export const updateHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!habit) return res.status(404).json({ message: "Habit not found" });

    const fields = [
      "name",
      "description",
      "category",
      "frequency",
      "targetDays",
      "color",
      "icon",
      "order",
    ];

    for (const f of fields) {
      if (req.body[f] !== undefined) habit[f] = req.body[f];
    }

    await habit.save();
    res.json(habit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete a habit and its associated logs
// @route   DELETE /api/habits/:id
export const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!habit) return res.status(404).json({ message: "Habit not found" });

    await HabitLog.deleteMany({ habitId: habit._id, userId: req.user._id });
    res.json({ message: "Habit deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Toggle a habit's archived status
// @route   PATCH /api/habits/:id/archive
export const archiveHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!habit) return res.status(404).json({ message: "Habit not found" });

    habit.isArchived = !habit.isArchived;
    await habit.save();
    res.json(habit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Reorder an array of habits
// @route   PUT /api/habits/reorder
export const reorderHabits = async (req, res) => {
  try {
    const { order } = req.body; // array of habit ids
    
    if (!Array.isArray(order)) {
      return res.status(400).json({ message: "order must be an array" });
    }

    await Promise.all(
      order.map((id, idx) =>
        Habit.updateOne(
          { _id: id, userId: req.user._id },
          { $set: { order: idx } }
        )
      )
    );

    res.json({ message: "Reordered" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};