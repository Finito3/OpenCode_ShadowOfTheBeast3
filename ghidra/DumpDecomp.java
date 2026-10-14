import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.Function;
import ghidra.program.model.listing.FunctionManager;
import ghidra.program.model.listing.Instruction;
import ghidra.program.model.listing.InstructionIterator;
import ghidra.util.task.ConsoleTaskMonitor;

public class DumpDecomp extends GhidraScript {
    public void run() throws Exception {
        Address start = currentProgram.getMinAddress();
        println("MIN ADDRESS: " + start);
        disassemble(start);
        analyzeAll(currentProgram);

        FunctionManager fm = currentProgram.getFunctionManager();
        DecompInterface d = new DecompInterface();
        d.openProgram(currentProgram);
        ConsoleTaskMonitor mon = new ConsoleTaskMonitor();

        int n = 0;
        for (Function f : fm.getFunctions(true)) { n++; }
        println("FUNCTION COUNT: " + n);

        for (Function f : fm.getFunctions(true)) {
            println("FUNC " + f.getName() + " @ " + f.getEntryPoint()
                    + " size=" + f.getBody().getNumAddresses());
            InstructionIterator it = currentProgram.getListing()
                    .getInstructions(f.getBody(), true);
            while (it.hasNext()) {
                Instruction ins = it.next();
                println("   " + ins.getAddress() + ": " + ins.toString());
            }
            DecompileResults r = d.decompileFunction(f, 90, mon);
            if (r != null && r.decompileCompleted()
                    && r.getDecompiledFunction() != null) {
                String c = r.getDecompiledFunction().getC();
                if (c != null && c.trim().length() > 0) {
                    println("/* ==== DECOMP " + f.getName() + " ==== */");
                    println(c);
                }
            }
        }
        d.dispose();
    }
}
