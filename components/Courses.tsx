'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react'
import { ApiError, getCourse, listCourses, type CourseDetail, type CourseListItem } from '@/lib/api'
import { ErrorBox, Loading, difficultyColor } from '@/components/shared'

export default function Courses({ openProblem }: { openProblem: (id: string) => void }) {
  const [courses, setCourses] = useState<CourseListItem[] | null>(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    listCourses()
      .then(setCourses)
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load courses. Is the backend running?'))
  }, [])

  if (selected) return <CourseDetailView courseId={selected} onBack={() => setSelected(null)} openProblem={openProblem} />

  return <main className="section-wrap page-top">
    <div className="workspace-heading">
      <div><p className="eyebrow">THE QUBITLAB CATALOG</p><h1>Learn at your level.</h1><p>Concepts, circuits, and challenges designed to compound.</p></div>
    </div>
    {!courses && !error && <Loading label="Loading courses…" />}
    {error && <ErrorBox message={error} />}
    {courses && courses.length === 0 && <p className="muted">No courses have been published yet.</p>}
    {courses && courses.length > 0 && <div className="course-grid">
      {courses.map(c => (
        <button key={c.id} className="track-card" onClick={() => setSelected(c.id)}>
          <span className={'tag ' + difficultyColor(c.difficulty)}>{c.difficulty}</span>
          <h3>{c.title}</h3>
          <p>{c.description}</p>
          <div className="track-foot"><span>{c.problemCount} problem{c.problemCount === 1 ? '' : 's'}</span><ArrowRight size={16} /></div>
        </button>
      ))}
    </div>}
  </main>
}

function CourseDetailView({ courseId, onBack, openProblem }: { courseId: string; onBack: () => void; openProblem: (id: string) => void }) {
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getCourse(courseId)
      .then(setCourse)
      .catch(err => setError(err instanceof ApiError ? err.message : 'Could not load this course.'))
  }, [courseId])

  return <main className="section-wrap page-top">
    <button className="link-btn" onClick={onBack} style={{ marginBottom: 20 }}><ArrowLeft size={14} /> All courses</button>
    {!course && !error && <Loading label="Loading course…" />}
    {error && <ErrorBox message={error} />}
    {course && <>
      <div className="workspace-heading">
        <div><p className="eyebrow">{course.difficulty}</p><h1>{course.title}</h1><p>{course.description}</p></div>
      </div>
      {course.problems.length === 0 && <p className="muted">No problems have been added to this course yet.</p>}
      {course.problems.length > 0 && <div className="problem-table">
        {course.problems.map((p, i) => (
          <button key={p.problemId} className="problem-row" onClick={() => openProblem(p.problemId)}>
            <span className="problem-status" />
            <span><strong>{i + 1}. {p.title}</strong><small>{p.topic}</small></span>
            <span className="difficulty">{p.difficulty}</span>
            <span className="muted" />
            <span className="success" />
            <ChevronRight size={16} />
          </button>
        ))}
      </div>}
    </>}
  </main>
}
