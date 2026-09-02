import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { AppState, GradeEntry, Role, Student, User } from './types';

const STORAGE_KEY = 'colegio-jose-francisco-caldas-state-v1';
const logoUrl = new URL('../logo_jose.png', import.meta.url).href;

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

const PERIODS = ['Periodo 1', 'Periodo 2', 'Periodo 3', 'Periodo 4'] as const;

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

function calculateAverage(scores: number[]) {
  if (scores.length === 0) {
    return null;
  }

  const total = scores.reduce((sum, score) => sum + score, 0);
  return total / scores.length;
}

export default function App() {
  const [state, setState] = useState<AppState>(() => readState());
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [message, setMessage] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('Todas');
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
    term: PERIODS[0],
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

  const isStudent = currentUser?.role === 'student';
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'teacher';

  const visibleStudents = useMemo(() => {
    if (!currentUser) {
      return [];
    }
    if (currentUser.role === 'student') {
      return state.students.filter((student) => student.userId === currentUser.id);
    }
    return state.students;
  }, [currentUser, state.students]);

  const studentRecord = useMemo(() => {
    if (!currentUser || currentUser.role !== 'student') {
      return null;
    }
    return state.students.find((student) => student.userId === currentUser.id) ?? null;
  }, [currentUser, state.students]);

  const studentGrades = useMemo(() => {
    if (!studentRecord) {
      return [];
    }
    return state.grades.filter((entry) => entry.studentId === studentRecord.id);
  }, [state.grades, studentRecord]);

  const studentTerms = useMemo(() => ['Todas', ...PERIODS], []);

  const studentGradesByTerm = useMemo(() => {
    return PERIODS.reduce<Record<string, GradeEntry[]>>((accumulator, term) => {
      accumulator[term] = studentGrades.filter((entry) => entry.term === term);
      return accumulator;
    }, {});
  }, [studentGrades]);

  const studentAverage = useMemo(() => {
    return calculateAverage(studentGrades.map((entry) => entry.score));
  }, [studentGrades]);

  const finalAverage = useMemo(() => {
    const firstThreePeriods = PERIODS.slice(0, 3);
    const periodAverages = firstThreePeriods
      .map((term) => calculateAverage(studentGradesByTerm[term]?.map((entry) => entry.score) ?? []))
      .filter((value): value is number => value !== null);

    return calculateAverage(periodAverages);
  }, [studentGradesByTerm]);

  const selectedStudent = useMemo(() => {
    if (visibleStudents.length === 0) {
      return null;
    }

    return (
      state.students.find((student) => student.id === selectedStudentId) ??
      state.students.find((student) => student.id === gradeForm.studentId) ??
      visibleStudents[0]
    );
  }, [gradeForm.studentId, selectedStudentId, state.students, visibleStudents]);

  const selectedStudentGrades = useMemo(() => {
    if (!selectedStudent) {
      return [];
    }

    return state.grades.filter((entry) => entry.studentId === selectedStudent.id);
  }, [selectedStudent, state.grades]);

  const selectedStudentGradesByTerm = useMemo(() => {
    return PERIODS.reduce<Record<string, GradeEntry[]>>((accumulator, term) => {
      accumulator[term] = selectedStudentGrades.filter((entry) => entry.term === term);
      return accumulator;
    }, {});
  }, [selectedStudentGrades]);

  const selectedStudentFinalAverage = useMemo(() => {
    const firstThreePeriods = PERIODS.slice(0, 3);
    const periodAverages = firstThreePeriods
      .map((term) => calculateAverage(selectedStudentGradesByTerm[term]?.map((entry) => entry.score) ?? []))
      .filter((value): value is number => value !== null);

    return calculateAverage(periodAverages);
  }, [selectedStudentGradesByTerm]);

  const filteredStudentGrades = useMemo(() => {
    if (selectedTerm === 'Todas') {
      return studentGrades;
    }
    return studentGrades.filter((entry) => entry.term === selectedTerm);
  }, [selectedTerm, studentGrades]);

  const visibleGrades = useMemo(() => {
    if (!currentUser) {
      return [];
    }
    if (currentUser.role === 'student') {
      return filteredStudentGrades;
    }
    if (currentUser.role === 'teacher') {
      return state.grades;
    }
    return state.grades;
  }, [currentUser, filteredStudentGrades, state.grades]);

  useEffect(() => {
    if (isStudent && studentTerms.length > 0 && !studentTerms.includes(selectedTerm)) {
      setSelectedTerm('Todas');
    }
  }, [isStudent, selectedTerm, studentTerms]);

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
    setGradeForm({ studentId: student.id, subject: '', score: '', term: PERIODS[0] });
    showMessage('Nota guardada.');
  }

  function handleLogout() {
    setState((current) => ({ ...current, sessionUserId: null }));
    setSelectedTerm('Todas');
    showMessage('Sesión cerrada.');
  }

  if (!currentUser) {
    return (
      <main className="shell auth-shell">
        <section className="hero-panel">
          <div className="logo-shell hero-logo-shell">
            <img className="hero-logo" src={logoUrl} alt="Logo del Colegio José Francisco Caldas" />
          </div>
          <div className="badge">Portal estudiantil</div>
          <h1>Colegio José Francisco Caldas</h1>
          <p>
            Acceso institucional para estudiantes, docentes y personal del colegio. Consulta de notas, registro de estudiantes y seguimiento académico.
          </p>
          <div className="seed-list">
            <span>Administración: admin@colegio.test / Admin123</span>
            <span>Docente: docente@colegio.test / Docente123</span>
            <span>Estudiante: alumno@colegio.test / Alumno123</span>
          </div>
        </section>

        <section className="card auth-card">
          <div className="auth-card-header">
            <h2>{authMode === 'login' ? 'Ingreso a la plataforma' : 'Registro de usuario'}</h2>
            <p>
              {authMode === 'login'
                ? 'Ingresa con tu correo y contraseña institucional.'
                : 'Crea una cuenta institucional para estudiantes, docentes o administración.'}
            </p>
          </div>

          <div className="tabs">
            <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')} type="button">
              Entrar
            </button>
            <button className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')} type="button">
              Crear usuario
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="stack auth-form">
            <label>
              Correo
              <span className="field-hint">Usa el correo con el que te registraron.</span>
              <input value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} type="email" required />
            </label>
            <label>
              Contraseña
              <span className="field-hint">Debe coincidir con la cuenta del colegio.</span>
              <input value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} type="password" required />
            </label>

            {authMode === 'register' && (
              <div className="stack auth-extra-fields">
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
              </div>
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
        <div className="brand-block">
          <div className="logo-shell topbar-logo-shell">
            <img className="topbar-logo" src={logoUrl} alt="Logo del Colegio José Francisco Caldas" />
          </div>
          <div>
            <div className="badge">Colegio José Francisco Caldas</div>
            <h2>{currentUser.name}</h2>
            <p>{currentUser.role === 'admin' ? 'Secretaría' : currentUser.role === 'teacher' ? 'Docente' : 'Estudiante'}</p>
          </div>
        </div>
        <button className="ghost" onClick={handleLogout} type="button">
          Salir
        </button>
      </header>

      {isStudent ? (
        <section className="student-view card">
          <div className="student-view-header">
            <div>
              <div className="badge dark-badge">Mis calificaciones</div>
              <h3>{studentRecord ? studentRecord.fullName : currentUser.name}</h3>
              <p>
                {studentRecord
                  ? `${studentRecord.grade} ${studentRecord.group}`
                  : 'No tienes un estudiante asociado en este momento.'}
              </p>
            </div>
            <div className="student-summary">
              <div>
                <span>Períodos</span>
                <strong>{studentTerms.length - 1}</strong>
              </div>
              <div>
                <span>Promedio final</span>
                <strong>{finalAverage !== null ? finalAverage.toFixed(1) : '--'}</strong>
              </div>
            </div>
          </div>

          <div className="term-tabs" role="tablist" aria-label="Filtrar por período">
            {studentTerms.map((term) => (
              <button
                key={term}
                type="button"
                className={selectedTerm === term ? 'term-tab active' : 'term-tab'}
                onClick={() => setSelectedTerm(term)}
              >
                {term}
              </button>
            ))}
          </div>

          <div className="table-wrap student-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Materia</th>
                  <th>Nota</th>
                  <th>Período</th>
                  <th>Docente</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {visibleGrades.map((grade) => (
                  <tr key={grade.id}>
                    <td>{grade.subject}</td>
                    <td>{grade.score.toFixed(1)}</td>
                    <td>{grade.term}</td>
                    <td>{grade.teacherName}</td>
                    <td>{formatDate(grade.createdAt)}</td>
                  </tr>
                ))}
                {visibleGrades.length === 0 && (
                  <tr>
                    <td colSpan={5}>No hay notas para este período.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <>
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

          <section className="admin-grid">
            <div className="stack">
              {isStaff && (
                <section className="card action-card">
                  <h3>Registro de estudiante</h3>
                  <p>Agrega estudiantes nuevos al sistema académico.</p>
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

              {isStaff && (
                <section className="card action-card">
                  <h3>Registro de notas</h3>
                  <p>Selecciona el estudiante activo y luego agrega las notas por período.</p>

                  <div className="student-picker">
                    <label>
                      Alumno seleccionado
                      <select
                        value={selectedStudentId || gradeForm.studentId}
                        onChange={(event) => {
                          setSelectedStudentId(event.target.value);
                          setGradeForm((current) => ({ ...current, studentId: event.target.value }));
                        }}
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
                  </div>

                  <form onSubmit={handleCreateGrade} className="stack compact">
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
                        <select
                          value={gradeForm.term}
                          onChange={(event) => setGradeForm((current) => ({ ...current, term: event.target.value }))}
                          required
                        >
                          {PERIODS.map((term) => (
                            <option key={term} value={term}>
                              {term}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <button className="primary" type="submit">
                      Guardar nota
                    </button>
                  </form>

                  {selectedStudent && (
                    <div className="selected-student-summary">
                      <div>
                        <span>Alumno activo</span>
                        <strong>{selectedStudent.fullName}</strong>
                      </div>
                      <div>
                        <span>Promedio final</span>
                        <strong>{selectedStudentFinalAverage !== null ? selectedStudentFinalAverage.toFixed(1) : '--'}</strong>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>

            <div className="stack">
              {currentUser.role === 'admin' && (
                <section className="card action-card">
                  <h3>Crear usuario institucional</h3>
                  <p>Genera accesos para estudiantes, docentes o administración.</p>
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

              <section className="card action-card">
                <h3>Notas del alumno activo</h3>
                <p>Las calificaciones se muestran separadas por período para que no se mezclen.</p>
                {selectedStudent ? (
                  <div className="period-grid">
                    {PERIODS.map((term) => {
                      const termGrades = selectedStudentGradesByTerm[term] ?? [];
                      const termAverage = calculateAverage(termGrades.map((entry) => entry.score));

                      return (
                        <article key={term} className="period-card">
                          <div className="period-card-header">
                            <div>
                              <span>{term}</span>
                              <strong>{termAverage !== null ? termAverage.toFixed(1) : '--'}</strong>
                            </div>
                          </div>
                          <div className="period-list">
                            {termGrades.length > 0 ? (
                              termGrades.map((grade) => (
                                <div className="grade-pill" key={grade.id}>
                                  <div>
                                    <strong>{grade.subject}</strong>
                                    <span>{grade.teacherName}</span>
                                  </div>
                                  <strong>{grade.score.toFixed(1)}</strong>
                                </div>
                              ))
                            ) : (
                              <p className="empty-state">Sin notas registradas.</p>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="empty-state">Selecciona un alumno para ver sus notas por período.</p>
                )}
              </section>

              <section className="card action-card">
                <h3>Promedio final</h3>
                <p>Se calcula a partir de los períodos registrados del alumno activo.</p>
                <div className="final-average-box">
                  <strong>{selectedStudentFinalAverage !== null ? selectedStudentFinalAverage.toFixed(1) : '--'}</strong>
                  <span>
                    {selectedStudentFinalAverage !== null
                      ? 'Promedio acumulado de los tres primeros períodos disponibles.'
                      : 'Todavía no hay suficientes notas para calcularlo.'}
                  </span>
                </div>
              </section>
            </div>
          </section>
        </>
      )}

      {message && <p className="message floating">{message}</p>}
    </main>
  );
}
