'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../app/lib/firebase';

// 📝 Tipe data untuk tugas
type Task = {
  id: string;
  text: string;
  completed: boolean;
  deadline: string;
};

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>({});

  // 📦 Ambil data dari Firestore saat komponen pertama kali dimuat
  useEffect(() => {
    const fetchTasks = async () => {
      const snapshot = await getDocs(collection(db, 'tasks'));
      const taskList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(taskList);
    };
    fetchTasks();
  }, []);

  // ⏱️ Perbarui waktu tersisa tiap detik
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedTime = tasks.reduce((acc, task) => {
        acc[task.id] = calculateTimeRemaining(task.deadline);
        return acc;
      }, {} as { [key: string]: string });
      setTimeRemaining(updatedTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  // 🧮 Hitung sisa waktu dari deadline
  const calculateTimeRemaining = (deadline: string): string => {
    const deadlineTime = new Date(deadline).getTime();
    const now = new Date().getTime();
    const difference = deadlineTime - now;

    if (difference <= 0) return 'Waktu habis!';

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `${hours}j ${minutes}m ${seconds}d`;
  };

  // ➕ Tambahkan tugas baru
  const addTask = async (): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambahkan Tugas Baru',
      html: `
        <input id="swal-input1" class="swal2-input" placeholder="Nama tugas">
        <input id="swal-input2" type="datetime-local" class="swal2-input">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      preConfirm: () => [
        (document.getElementById('swal-input1') as HTMLInputElement)?.value,
        (document.getElementById('swal-input2') as HTMLInputElement)?.value,
      ],
    });

    if (formValues?.[0] && formValues?.[1]) {
      const newTask: Omit<Task, 'id'> = {
        text: formValues[0],
        completed: false,
        deadline: formValues[1],
      };

      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      setTasks([...tasks, { id: docRef.id, ...newTask }]);

      Swal.fire({
        icon: 'success',
        title: 'Tersimpan!',
        text: 'Tugas baru berhasil ditambahkan ',
        timer: 1500,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
      });
    }
  };

  // ✏️ Edit tugas yang ada
  const editTask = async (task: Task): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Tugas',
      html: `
        <input id="swal-input1" class="swal2-input" placeholder="Nama tugas" value="${task.text}">
        <input id="swal-input2" type="datetime-local" class="swal2-input" value="${new Date(task.deadline).toISOString().slice(0, 16)}">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      preConfirm: () => [
        (document.getElementById('swal-input1') as HTMLInputElement)?.value,
        (document.getElementById('swal-input2') as HTMLInputElement)?.value,
      ],
    });

    if (formValues?.[0] && formValues?.[1]) {
      const updatedTask = { ...task, text: formValues[0], deadline: formValues[1] };
      await updateDoc(doc(db, 'tasks', task.id), {
        text: updatedTask.text,
        deadline: updatedTask.deadline,
      });

      setTasks(tasks.map((t) => (t.id === task.id ? updatedTask : t)));

      Swal.fire({
        icon: 'success',
        title: 'Tersimpan!',
        text: 'Tugas berhasil di edit',
        timer: 1500,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
      });
    }
  };

  // ✅ Tandai selesai / belum
  const toggleTask = async (id: string): Promise<void> => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);

    await updateDoc(doc(db, 'tasks', id), {
      completed: updatedTasks.find((task) => task.id === id)?.completed,
    });
  };

  // ❌ Hapus tugas
  const deleteTask = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'tasks', id));
    setTasks(tasks.filter((task) => task.id !== id));

    Swal.fire({
      icon: 'success',
      title: 'Dihapus!',
      text: 'Tugas berhasil dihapus ',
      timer: 1500,
      showConfirmButton: false,
      position: 'top-end',
      toast: true,
    });
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-gradient-to-br from-white via-sky-50 to-sky-100 shadow-lg rounded-xl">
  <h1 className="text-3xl font-bold text-sky-600 text-center mb-6">📋 To-Do List</h1>

  <div className="flex justify-center mb-6">
    <button
      onClick={addTask}
      className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-full shadow transition"
    >
     + Tambah Tugas Baru
    </button>
  </div>


      <ul>
        <AnimatePresence>
          {tasks.map((task) => {
            const timeLeft = calculateTimeRemaining(task.deadline);
            const isExpired = timeLeft === 'Waktu habis!';
            const taskColor = task.completed
              ? 'bg-emerald-100'
              : isExpired
              ? 'bg-rose-100'
              : 'bg-yellow-100';

            return (
              <motion.li
                key={task.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex flex-col gap-1 p-3 mb-2 rounded-lg shadow-sm ${taskColor}`}
              >
                <div className="flex justify-between items-center">
                  <span
                    onClick={() => toggleTask(task.id)}
                    className={`cursor-pointer ${
                      task.completed
                        ? 'line-through text-gray-500'
                        : 'font-medium text-gray-800'
                    }`}
                  >
                    {task.text}
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => editTask(task)}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-full text-sm shadow"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="bg-red-400 hover:bg-red-500 text-white px-3 py-1 rounded-full text-sm shadow"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-700">
                  <p>📅 Deadline: {new Date(task.deadline).toLocaleString()}</p>
                  <p>⏳ {timeRemaining[task.id] || 'Menghitung...'}</p>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
