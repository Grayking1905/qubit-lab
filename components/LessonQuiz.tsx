'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { playPopDown, playSuccess, playError } from '@/lib/sounds'

export interface QuizData {
  question: string
  options: string[]
  correct: number
  explanation: string
}

export default function LessonQuiz({ quiz }: { quiz: QuizData }) {
  const [picked, setPicked] = useState<number | null>(null)
  const answered = picked !== null
  const right = answered && picked === quiz.correct

  return (
    <div className="lesson-quiz">
      <p className="muted-label">CHECK YOURSELF</p>
      <h3>{quiz.question}</h3>
      <div className="lesson-quiz-opts">
        {quiz.options.map((opt, i) => {
          const show = answered && (i === quiz.correct || i === picked)
          const ok = i === quiz.correct
          return (
            <motion.button
              key={opt}
              className={`lesson-quiz-opt ${show && ok ? 'ok' : ''} ${show && !ok && i === picked ? 'bad' : ''}`}
              onClick={() => {
                if (answered) return
                setPicked(i)
                if (i === quiz.correct) playSuccess()
                else playError()
              }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{opt}</span>
              {show && ok && <Check size={14} />}
            </motion.button>
          )
        })}
      </div>
      {answered && (
        <motion.p className={right ? 'lesson-quiz-explain ok' : 'lesson-quiz-explain'} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          {right ? 'Correct. ' : 'Not quite. '}
          {quiz.explanation}
        </motion.p>
      )}
      {answered && (
        <button className="link-btn" style={{ marginTop: 10 }} onClick={() => { setPicked(null); playPopDown() }}>Try again</button>
      )}
    </div>
  )
}
