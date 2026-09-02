import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { AppState, GradeEntry, Role, Student, User } from './types';

const STORAGE_KEY = 'colegio-portal-state-v1';

const defaultState: AppState = {
  users: [
    {
      id: 'u-admin',
      name: 'Administración',
      email: 'admin@colegio.test',
      password: 'Admin123',
      role: 'admin',
    },
    {
      id: 'u-teacher',
      name: 'Docente Demo',
      email: 'docente@colegio.test',
      password: 'Docente123',
      role: 'teacher',
    },
    {
      id: 'u-student',
      name: 'Ana Pérez',
      email: 'alumno@colegio.test',
      password: 'Alumno123',
      role: 'student',
      studentId: 's-ana',
    },
  ],
  students: [
    {
      id: 's-ana',
      fullName: 'Ana Pérez',
      grade: '8vo',
      group: 'B',
      guardian: 'María López',
      userId: 'u-student',
    },
  ],
  grades: [
    {
      id: 'g-1',
      studentId: 's-ana',
      subject: 'Matemáticas',
      score: 18,
      term: 'Primer trimestre',
      teacherName: 'Docente Demo',
      createdAt: new Date().toISOString(),
    },
  ],
  sessionUserId: null,
};

type AuthMode = 'login' | 'register';

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function readState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return defaultState;
  }

  try {
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.users || !parsed.students || !parsed.grades) {
      return defaultState;
    }
    return parsed;
  } catch {
    return defaultState;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default function App() {
  const [state, setState] = useState<AppState>(() => readState());
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [message, setMessage] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student' as Role,
  });
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    grade: '',
    group: '',
    guardian: '',
  });
  const [gradeForm, setGradeForm] = useState({
    studentId: '',
    subject: '',
    score: '',
    term: '',
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!selectedStudentId && state.students[0]) {
      setSelectedStudentId(state.students[0].id);
    }
    if (!gradeForm.studentId && state.students[0]) {
      setGradeForm((current) => ({ ...current, studentId: state.students[0].id }));
    }
  }, [state.students, selectedStudentId, gradeForm.studentId]);

  const currentUser = useMemo(
    () => state.users.find((user) => user.id === state.sessionUserId) ?? null,
    [state.sessionUserId, state.users],
  );

  const visibleStudents = useMemo(() => {
    if (!currentUser) {
      return [];
    }
    if (currentUser.role === 'student') {
      return state.students.filter((student) => student.userId === currentUser.id);
    }
    return state.students;
  }, [currentUser, state.students]);

  const visibleGrades = useMemo(() => {
    if (!currentUser) {
      return [];
    }
    if (currentUser.role === 'student') {
      const student = state.students.find((item) => item.userId === currentUser.id);
      if (!student) {
        return [];
      }
      return state.grades.filter((entry) => entry.studentId === student.id);
    }
    if (currentUser.role === 'teacher') {
      return state.grades;
    }
    return state.grades;
  }, [currentUser, state.grades, state.students]);

  const studentsCount = state.students.length;
  const gradesCount = state.grades.length;
  const teacherCount = state.users.filter((user) => user.role === 'teacher').length;
  const studentAccountCount = state.users.filter((user) => user.role === 'student').length;

  function showMessage(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2500);
  }

  function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (authMode === 'login') {
      const user = state.users.find(
        (item) => item.email.toLowerCase() === authEmail.toLowerCase() && item.password === authPassword,
      );
      if (!user) {
        showMessage('Credenciales incorrectas.');
        return;
      }
      setState((current) => ({ ...current, sessionUserId: user.id }));
      setAuthPassword('');
      showMessage(`Bienvenido, ${user.name}.`);
      return;
    }

    if (state.users.some((item) => item.email.toLowerCase() === authEmail.toLowerCase())) {
      showMessage('Ese correo ya existe.');
      return;
    }

    const newUser: User = {
      id: createId('u'),
      name: userForm.name || authEmail.split('@')[0],
      email: authEmail,
      password: authPassword,
      role: userForm.role,
    };

    setState((current) => ({
      ...current,
      users: [...current.users, newUser],
      sessionUserId: newUser.id,
    }));
    setAuthPassword('');
    setUserForm({ name: '', email: '', password: '', role: 'student' });
    showMessage('Usuario creado y sesión iniciada.');
  }

  function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser || currentUser.role !== 'admin') {
      showMessage('Solo administración puede crear usuarios.');
      return;
    }

    if (state.users.some((item) => item.email.toLowerCase() === userForm.email.toLowerCase())) {
      showMessage('Ya existe un usuario con ese correo.');
      return;
    }

    const newUser: User = {
      id: createId('u'),
      name: userForm.name,
      email: userForm.email,
      password: userForm.password,
      role: userForm.role,
    };

    setState((current) => ({ ...current, users: [...current.users, newUser] }));
    setUserForm({ name: '', email: '', password: '', role: 'student' });
    showMessage('Usuario creado correctamente.');
  }

  function handleCreateStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) {
      showMessage('No tienes permiso para registrar estudiantes.');
      return;
    }

    const newStudent: Student = {
      id: createId('s'),
      fullName: studentForm.fullName,
      grade: studentForm.grade,
      group: studentForm.group,
      guardian: studentForm.guardian,
    };

    setState((current) => ({ ...current, students: [...current.students, newStudent] }));
    setStudentForm({ fullName: '', grade: '', group: '', guardian: '' });
    setSelectedStudentId(newStudent.id);
    setGradeForm((current) => ({ ...current, studentId: newStudent.id }));
    showMessage('Estudiante agregado.');
  }

  function handleCreateGrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) {
      showMessage('No tienes permiso para registrar notas.');
      return;
    }

    const numericScore = Number(gradeForm.score);
    if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 20) {
      showMessage('La nota debe estar entre 0 y 20.');
      return;
    }

    const student = state.students.find((item) => item.id === gradeForm.studentId);
    if (!student) {
      showMessage('Selecciona un estudiante válido.');
      return;
    }

    const newGrade: GradeEntry = {
      id: createId('g'),
      studentId: student.id,
      subject: gradeForm.subject,
      score: numericScore,
      term: gradeForm.term,
      teacherName: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    setState((current) => ({ ...current, grades: [...current.grades, newGrade] }));
    setGradeForm({ studentId: student.id, subject: '', score: '', term: '' });
    showMessage('Nota guardada.');
  }

  function handleLogout() {
    setState((current) => ({ ...current, sessionUserId: null }));
    showMessage('Sesión cerrada.');
  }

  if (!currentUser) {
    return (
      <main className="shell auth-shell">
        <section className="hero-panel">
          <div className="badge">Portal escolar</div>
          <h1>Control de estudiantes, notas y usuarios en un solo lugar.</h1>
          <p>
            Inicia como docente o administración para registrar estudiantes y calificaciones. Los alumnos pueden ver sus propias notas.
          </p>
          <div className="seed-list">
            <span>Admin: admin@colegio.test / Admin123</span>
            <span>Docente: docente@colegio.test / Docente123</span>
            <span>Alumno: alumno@colegio.test / Alumno123</span>
          </div>
        </section>

        <section className="card auth-card">
          <div className="tabs">
            <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')} type="button">
              Entrar
            </button>
            <button className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')} type="button">
              Crear usuario
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="stack">
            <label>
              Correo
              <input value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} type="email" required />
            </label>
            <label>
              Contraseña
              <input value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} type="password" required />
            </label>

            {authMode === 'register' && (
              <>
                <label>
                  Nombre
                  <input
                    value={userForm.name}
                    onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))}
                    type="text"
                    required
                  />
                </label>
                <label>
                  Rol
                  <select
                    value={userForm.role}
                    onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value as Role }))}
                  >
                    <option value="student">Estudiante</option>
                    <option value="teacher">Docente</option>
                    <option value="admin">Administración</option>
                  </select>
                </label>
              </>
            )}

            <button className="primary" type="submit">
              {authMode === 'login' ? 'Entrar al portal' : 'Crear y entrar'}
            </button>
          </form>
          {message && <p className="message">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="shell dashboard-shell">
      <header className="topbar card">
        <div>
          <div className="badge">Bienvenido</div>
          <h2>{currentUser.name}</h2>
          <p>{currentUser.role === 'admin' ? 'Administración' : currentUser.role === 'teacher' ? 'Docente' : 'Estudiante'}</p>
        </div>
        <button className="ghost" onClick={handleLogout} type="button">
          Salir
        </button>
      </header>

      <section className="stats-grid">
        <article className="stat card">
          <span>Estudiantes</span>
          <strong>{studentsCount}</strong>
        </article>
        <article className="stat card">
          <span>Notas</span>
          <strong>{gradesCount}</strong>
        </article>
        <article className="stat card">
          <span>Docentes</span>
          <strong>{teacherCount}</strong>
        </article>
        <article className="stat card">
          <span>Cuentas de estudiantes</span>
          <strong>{studentAccountCount}</strong>
        </article>
      </section>

      <section className="content-grid">
        <div className="stack">
          {(currentUser.role === 'admin' || currentUser.role === 'teacher') && (
            <section className="card">
              <h3>Registrar estudiante</h3>
              <form onSubmit={handleCreateStudent} className="stack compact">
                <label>
                  Nombre completo
                  <input
                    value={studentForm.fullName}
                    onChange={(event) => setStudentForm((current) => ({ ...current, fullName: event.target.value }))}
                    required
                  />
                </label>
                <div className="two-col">
                  <label>
                    Grado
                    <input
                      value={studentForm.grade}
                      onChange={(event) => setStudentForm((current) => ({ ...current, grade: event.target.value }))}
                      placeholder="8vo"
                      required
                    />
                  </label>
                  <label>
                    Grupo
                    <input
                      value={studentForm.group}
                      onChange={(event) => setStudentForm((current) => ({ ...current, group: event.target.value }))}
                      placeholder="A"
                      required
                    />
                  </label>
                </div>
                <label>
                  Acudiente
                  <input
                    value={studentForm.guardian}
                    onChange={(event) => setStudentForm((current) => ({ ...current, guardian: event.target.value }))}
                    required
                  />
                </label>
                <button className="primary" type="submit">
                  Agregar estudiante
                </button>
              </form>
            </section>
          )}

          {(currentUser.role === 'admin' || currentUser.role === 'teacher') && (
            <section className="card">
              <h3>Registrar nota</h3>
              <form onSubmit={handleCreateGrade} className="stack compact">
                <label>
                  Estudiante
                  <select
                    value={gradeForm.studentId}
                    onChange={(event) => setGradeForm((current) => ({ ...current, studentId: event.target.value }))}
                    required
                  >
                    <option value="">Selecciona uno</option>
                    {state.students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.fullName} - {student.grade} {student.group}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Materia
                  <input
                    value={gradeForm.subject}
                    onChange={(event) => setGradeForm((current) => ({ ...current, subject: event.target.value }))}
                    required
                  />
                </label>
                <div className="two-col">
                  <label>
                    Nota
                    <input
                      value={gradeForm.score}
                      onChange={(event) => setGradeForm((current) => ({ ...current, score: event.target.value }))}
                      type="number"
                      min="0"
                      max="20"
                      step="0.1"
                      required
                    />
                  </label>
                  <label>
                    Período
                    <input
                      value={gradeForm.term}
                      onChange={(event) => setGradeForm((current) => ({ ...current, term: event.target.value }))}
                      placeholder="Primer trimestre"
                      required
                    />
                  </label>
                </div>
                <button className="primary" type="submit">
                  Guardar nota
                </button>
              </form>
            </section>
          )}
        </div>

        <div className="stack">
          {currentUser.role === 'admin' && (
            <section className="card">
              <h3>Crear usuario</h3>
              <form onSubmit={handleCreateUser} className="stack compact">
                <label>
                  Nombre
                  <input
                    value={userForm.name}
                    onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  Correo
                  <input
                    value={userForm.email}
                    onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
                    type="email"
                    required
                  />
                </label>
                <label>
                  Contraseña
                  <input
                    value={userForm.password}
                    onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))}
                    type="password"
                    required
                  />
                </label>
                <label>
                  Rol
                  <select
                    value={userForm.role}
                    onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value as Role }))}
                  >
                    <option value="student">Estudiante</option>
                    <option value="teacher">Docente</option>
                    <option value="admin">Administración</option>
                  </select>
                </label>
                <button className="primary" type="submit">
                  Crear usuario
                </button>
              </form>
            </section>
          )}

          <section className="card">
            <h3>Estudiantes</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Curso</th>
                    <th>Acudiente</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleStudents.map((student) => (
                    <tr key={student.id}>
                      <td>{student.fullName}</td>
                      <td>{student.grade} {student.group}</td>
                      <td>{student.guardian}</td>
                    </tr>
                  ))}
                  {visibleStudents.length === 0 && (
                    <tr>
                      <td colSpan={3}>No hay estudiantes registrados para esta sesión.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <h3>Notas</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Materia</th>
                    <th>Nota</th>
                    <th>Período</th>
                    <th>Docente</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleGrades.map((grade) => {
                    const student = state.students.find((item) => item.id === grade.studentId);
                    return (
                      <tr key={grade.id}>
                        <td>{student?.fullName ?? 'Sin registro'}</td>
                        <td>{grade.subject}</td>
                        <td>{grade.score.toFixed(1)}</td>
                        <td>{grade.term}</td>
                        <td>{grade.teacherName}</td>
                        <td>{formatDate(grade.createdAt)}</td>
                      </tr>
                    );
                  })}
                  {visibleGrades.length === 0 && (
                    <tr>
                      <td colSpan={6}>No hay notas disponibles.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>

      {message && <p className="message floating">{message}</p>}
    </main>
  );
}
