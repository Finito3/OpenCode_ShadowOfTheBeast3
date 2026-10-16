import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.Address;
public class MultiEntry extends GhidraScript {
    public void run() throws Exception {
        long[] entries = {0x0, 0x4, 0x62, 0x14e, 0x228, 0x432};
        for (long e : entries) {
            try {
                Address a = currentProgram.getMinAddress().add(e);
                disassemble(a);
            } catch (Exception ex) { println("entry 0x"+Long.toHexString(e)+" fail"); }
        }
        analyzeAll(currentProgram);
        int n = 0;
        for (Object f : (Iterable<?>)currentProgram.getFunctionManager().getFunctions(true)) { n++; }
        println("FUNCTION COUNT: " + n);
    }
}
