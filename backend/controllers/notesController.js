const User = require("../models/User")
const Note = require("../models/Note")
const asyncHandler = require("express-async-handler")
const bcrypt = require("bcrypt")
const { findById } = require("../models/User")

//@desc Get all notes
//@route GET /notes
//@access Private
const getAllNotes = asyncHandler ( async (req, res) => {
    const notes = await Note.find().lean()

    if(!notes?.length) {
        return res.status(400).json({ message: "No notes found" })
    }

    // Add username to each note before sending the resonse
    const notesWithUser = await Promise.all(notes.map(async (note) => {
        const user = await User.findById(note.user).lean().exec()
        return {...note, username: user.username}
    }))

    res.json(notesWithUser)
})

//@desc Create new note
//@route POST /notes
//@access Private
const createNewNote = asyncHandler ( async (req, res) => {
    const { user, title, text } = req.body

    // Confirm data
    if(!user || !title || !text) {
        return res.status(400).json({ message: "All fields are required" })
    }

    // Check duplicates
    const duplicate = await Note.findOne({ title }).lean().exec()

    if(duplicate) {
        return res.status(409).json({ message: "Duplicate note title" })
    }

    // Create and store new note
    const noteObject = { user, title, text}
    const note = await Note.create(noteObject)

    if(note) {
        res.status(201).json({ message: "New note created" })
    } else {
        res.status(400).json({ message: "Invalid note date received" })
    }
})

//@desc Upfate a note
//@route PATCH /notes
//@access Private
const updateNote = asyncHandler ( async (req, res) => {
    const { id, user, title, text, completed } = req.body

    // Confirm data
    if(!id || !user || !title || !text || typeof completed !== "boolean") {
        return res.status(400).json({ message: "All fields are requied" })
    }

    const note = await Note.findById(id).exec()

    if(!note) {
        return res.status(400).json({ message: "Note not found" })
    }

    // Check for duplicates
    const duplicate = await Note.findOne({ title }).lean().exec()

    // Allow updates to the original note and avoid second note to update its title to first note that already exists
    if(duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: "Duplicate title" })
    }

    note.user = user
    note.title = title
    note.text = text
    note.completed = completed

    const updatedNote = await note.save()

    res.json({ message: `${updatedNote.title} updated` })
})

//@desc Delete a note
//@route DELETE /notes
//@access Private
const deleteNote = asyncHandler ( async (req, res) => {
    const { id } = req.body

    // Confirm data
    if(!id) {
        return res.status(400).json({ message: "Note ID Required"})
    }

    const note = await Note.findById(id).exec()
    if(!note) {
        return res.status(400).json({ message: "Note not found" })
    }

    const result = await note.deleteOne()

    const reply = `Note ${result.title} with id ${result._id} deleted`

    res.json(reply)
})

module.exports = {
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote
}